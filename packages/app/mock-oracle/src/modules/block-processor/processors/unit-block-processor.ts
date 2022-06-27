import PromisePool from "@supercharge/promise-pool";
import { BigNumber, ethers } from "ethers";
import { retryAsync } from "ts-retry";
import { RETRY_OPTION } from "../../../const/retry-options";
import { PostchainManager } from "../../postchain-manager";
import _ from "lodash";
import { Utils } from "../../../utils/utils";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import { ERC1155TOKEN_TRANSFER_EVENT, ERC721TOKEN_TRANSFER_EVENT } from "../../../const/setting";
import { SupportChainType, Web3Provider } from "@evm/base";

export class UnitBlockProcessor {
  private contractWhiteList: Set<string> = new Set<string>();
  private decoder = new ethers.utils.AbiCoder();
  constructor(contractList: Set<string>) {
    this.contractWhiteList = contractList;
  }
  async processBlock(chain: SupportChainType, blockNumber: number) {
    const provider = Web3Provider.jsonRPCProvider(chain);
    try {
      const block = await retryAsync(async () => {
        return await provider.getBlockWithTransactions(blockNumber);
      }, RETRY_OPTION);
      const res = await PromisePool.withConcurrency(70)
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
        const postchainManager = await PostchainManager.init();
        await postchainManager.transferComplexOwnerships(integratedTokenInfos);
      }
    } catch (error) {
      Utils.handlingError(error, "processBlock");
    }
  }

  private async treatTx(tx: ethers.providers.TransactionResponse, chain: SupportChainType) {
    try {
      const confirmedTx = await retryAsync(async () => {
        return await tx.wait();
      }, RETRY_OPTION);
      const res = confirmedTx.logs.map((log) => {
        const contractAddress = log.address.toLowerCase();
        if (this.contractWhiteList.has(contractAddress)) {
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
}
