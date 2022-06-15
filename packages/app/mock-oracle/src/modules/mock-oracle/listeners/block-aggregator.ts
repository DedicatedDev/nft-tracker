import { ContractInfo, InfuraProvider, SupportChainType } from "@evm/base";
import { BigNumber, ethers } from "ethers";
import { PromisePool } from "@supercharge/promise-pool";
import { PostchainManager } from "../postchain-manager";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import { ExtendedProvider } from "../../../interface/provide-info";
import _ from "lodash";
import { Utils } from "../../../utils/utils";
import chalk from "chalk";

export class BlockAggregator {
  private providers: ExtendedProvider[] = [];
  private watchContractList: ContractInfo[];
  private watchContractAddressList: Set<string> = new Set<string>();
  private decoder = new ethers.utils.AbiCoder();
  private postchainManager: PostchainManager;

  constructor(watchContracts: ContractInfo[], txManager: PostchainManager) {
    watchContracts.map((contract) => {
      const infuraManager = new InfuraProvider();
      const infuraInfo = infuraManager.providers(contract.chain);
      const provider = new ethers.providers.JsonRpcBatchProvider(infuraInfo.endpoints.http);
      const extendedProvider: ExtendedProvider = { chain: contract.chain, provider: provider };
      this.providers.push(extendedProvider);
    });
    this.watchContractList = watchContracts;
    watchContracts.map((contract) => {
      this.watchContractAddressList.add(contract.address.toLowerCase());
    });
    this.postchainManager = txManager;
  }

  async processBlock(eProvider: ExtendedProvider, blockNumber: number, chain: SupportChainType) {
    try {
      const block = await eProvider.provider.getBlockWithTransactions(blockNumber);
      const res = await PromisePool.withConcurrency(20)
        .for(block.transactions)
        .process(async (tx) => {
          return await this.treatTx(tx, chain);
        });
      const totalTokenInfos = res.results.map((tokens) => {
        const tokenInfos = tokens.map((token) => {
          if (token !== undefined) {
            const tokenInfo: TokenInfo = {
              tokenId: +token!.id.toString(),
              owner: token!.owner,
              blockNumber: blockNumber,
              contractAddress: token!.address,
              type: token!.type,
              chain: token.chain,
            };
            return tokenInfo;
          }
        });
        return _.compact(tokenInfos);
      });
      const integratedTokenInfos = totalTokenInfos.flat();
      if (integratedTokenInfos.length != 0) {
        await this.postchainManager.transferComplexOwnerShips(integratedTokenInfos);
      }
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  async treatTx(tx: ethers.providers.TransactionResponse, chain: SupportChainType) {
    const confirmedTx = await tx.wait();
    const res = await PromisePool.withConcurrency(20)
      .for(confirmedTx.logs)
      .process(async (log) => {
        const contractAddress = log.address.toLowerCase();
        if (this.watchContractAddressList.has(contractAddress)) {
          if (log.topics.includes(ethers.utils.solidityKeccak256(["string"], ["Transfer(address,address,uint256)"]))) {
            const tokenId: BigNumber = this.decoder.decode(["uint256"], log.topics[2])[0].toNumber();
            const owner: string = this.decoder.decode(["address"], log.topics[1])[0].toLowerCase();
            console.log("============ERC721=============");
            console.log(tokenId);
            console.log(owner);
            console.log("====================================");
            return { type: "ERC721", address: contractAddress, id: tokenId, owner: owner, chain: chain };
          }
          else if (
            log.topics.includes(
              ethers.utils.solidityKeccak256(["string"], ["TransferSingle(address,address,address,uint256,uint256)"])
            )
          ) {
            const tokenId: BigNumber = this.decoder.decode(["uint256"], log.data)[0].toNumber();
            const owner: string = this.decoder.decode(["address"], log.topics[3])[0].toLowerCase();
            return { type: "ERC1155", address: contractAddress, id: tokenId, owner: owner, chain: chain };
          }
        }
      });
    Utils.handlingBatchError(res.errors);
    return res.results;
  }

  async start() {
    this.providers.map(async (p) => {
      p.provider.on("block", (blockNumber: number) => {
        process.stdout.write(
          `\r🕵  ${chalk.bold.red(p.chain.toUpperCase())}   : Script is at:  ${chalk.green(
            BigNumber.from(blockNumber)
          )}\n`
        );
        this.processBlock(p, blockNumber, p.chain);
      });
    });
  }
}
