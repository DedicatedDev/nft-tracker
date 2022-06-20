import { ContractInfo, Provider, SupportChainType } from "@evm/base";
import { BigNumber, ethers } from "ethers";
import { PromisePool } from "@supercharge/promise-pool";
import { PostchainManager } from "../postchain-manager";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import { ExtendedProvider } from "../../../interface/provide-info";
import _ from "lodash";
import { Utils } from "../../../utils/utils";
import chalk from "chalk";
import { ERC1155TOKEN_TRANSFER_EVENT, ERC721TOKEN_TRANSFER_EVENT } from "../../../const/setting";
import { add, save, complete, suite, cycle } from "benny";
import path from "path";
import { performance } from "perf_hooks";

export class BlockProcessor {
  private providers: ExtendedProvider[] = [];
  private watchContractAddressList: Set<string> = new Set<string>();
  private decoder = new ethers.utils.AbiCoder();
  private postchainManager: PostchainManager;

  constructor(watchContracts: ContractInfo[], txManager: PostchainManager) {
    watchContracts.map((contract) => {
      const infuraManager = new Provider();
      const infuraInfo = infuraManager.providers(contract.chain);
      const provider = new ethers.providers.JsonRpcBatchProvider(infuraInfo.endpoints.http);
      const extendedProvider: ExtendedProvider = { chain: contract.chain, provider: provider };
      this.providers.push(extendedProvider);
    });

    watchContracts.map((contract) => {
      this.watchContractAddressList.add(contract.address.toLowerCase());
    });
    this.postchainManager = txManager;
  }

  async processBlock(provider: ethers.providers.JsonRpcBatchProvider, blockNumber: number, chain: SupportChainType) {
  
    const start = performance.now();
    try {
      const block = await provider.getBlockWithTransactions(blockNumber);
      const res = await PromisePool.withConcurrency(20)
        .for(block.transactions)
        .process(async (tx) => {
          return await this.treatTx(tx, chain);
        });
      const totalTokenInfos = res.results.map((tokens) => {
        const tokenInfos = _.compact(tokens).map((token) => {
          const tokenInfo: TokenInfo = {
            tokenId: +token!.id.toString(),
            owner: token!.owner,
            blockNumber: blockNumber,
            contractAddress: token!.address,
            type: token!.type,
            chain: token.chain,
          };
          return tokenInfo;
        });
        return tokenInfos;
      });
      const integratedTokenInfos = totalTokenInfos.flat();
      if (integratedTokenInfos.length != 0) {
        await this.postchainManager.transferComplexOwnerships(integratedTokenInfos);
      }
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  async treatTx(tx: ethers.providers.TransactionResponse, chain: SupportChainType) {
    const confirmedTx = await tx.wait();
    const res = confirmedTx.logs.map((log) => {
      const contractAddress = log.address.toLowerCase();
      if (this.watchContractAddressList.has(contractAddress)) {
        if (log.topics.includes(ERC721TOKEN_TRANSFER_EVENT)) {
          const tokenId: BigNumber = this.decoder.decode(["uint256"], log.topics[2])[0].toNumber();
          const owner: string = this.decoder.decode(["address"], log.topics[1])[0].toLowerCase();
          return { type: "ERC721", address: contractAddress, id: tokenId, owner: owner, chain: chain };
        } else if (log.topics.includes(ERC1155TOKEN_TRANSFER_EVENT)) {
          const tokenId: BigNumber = this.decoder.decode(["uint256"], log.data)[0].toNumber();
          const owner: string = this.decoder.decode(["address"], log.topics[3])[0].toLowerCase();
          return { type: "ERC1155", address: contractAddress, id: tokenId, owner: owner, chain: chain };
        }
      }
    });
    return res;
  }

  async start(watchContracts: ContractInfo[]) {
    watchContracts.forEach((contract) => {
      const infuraManager = new Provider();
      const infuraInfo = infuraManager.providers(contract.chain);
      const provider = new ethers.providers.JsonRpcBatchProvider(infuraInfo.endpoints.http);
      provider.on("block", (blockNumber: number) => {
        process.stdout.write(
          `\r🕵  ${chalk.bold.red(contract.chain.toUpperCase())}   : Script is at:  ${chalk.green(
            BigNumber.from(blockNumber)
          )}\n`
        );
        this.processBlock(provider, blockNumber, contract.chain);
      });
    });
  }
}
