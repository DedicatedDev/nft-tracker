import { ContractInfo, Web3Provider, SupportChainType } from "@evm/base";
import { BigNumber, ethers } from "ethers";
import { PromisePool } from "@supercharge/promise-pool";
import { PostchainManager } from "../postchain-manager";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import _ from "lodash";
import { Utils } from "../../../utils/utils";
import chalk from "chalk";
import { ERC1155TOKEN_TRANSFER_EVENT, ERC721TOKEN_TRANSFER_EVENT } from "../../../const/setting";
import { retryAsync } from "ts-retry";
import { WSSProvider } from "./wss-provider";

export class BlockProcessor {
  private watchContractAddressList: Set<string> = new Set<string>();
  private decoder = new ethers.utils.AbiCoder();
  private postchainManager: PostchainManager;

  constructor(watchContracts: ContractInfo[], txManager: PostchainManager) {
    watchContracts.forEach((contract) => {
      this.watchContractAddressList.add(contract.address.toLowerCase());
    });
    this.postchainManager = txManager;
  }

  async processBlock(provider: WSSProvider, blockNumber: number, chain: SupportChainType) {
    try {
      const block = await retryAsync(
        async () => {
          return await provider.getBlockWithTransactions(blockNumber);
        },
        { maxTry: 3 }
      );
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
      Utils.handlingError(error, "processBlock");
    }
  }

  async treatTx(tx: ethers.providers.TransactionResponse, chain: SupportChainType) {
    try {
      const confirmedTx = await retryAsync(
        async () => {
          return await tx.wait(1);
        },
        { maxTry: 3 }
      );
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
    } catch (error) {
      Utils.handlingError(error, "treatTx");
    }
  }

  async start(watchContracts: ContractInfo[]) {
    const uniqueChains = _.uniqBy(watchContracts, "chain");
    uniqueChains.forEach((contract) => {
      const providerInfo = Web3Provider.getProviderInfo(contract.chain);
      const provider = new WSSProvider(providerInfo.endpoints.wss);
      provider.safeConnect();
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
