import { PostchainManager } from "../../postchain-manager";
import _ from "lodash";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import { ContractInfo, NFTContractType, SupportChainType, Web3Provider } from "@evm/base";
import { ethers } from "ethers";

export class UnitEventProcessor {
  private postchainManager: PostchainManager;
  constructor(postchainManager: PostchainManager) {
    this.postchainManager = postchainManager;
  }
  async treatEvent(chain: SupportChainType, event: ethers.Event, type: NFTContractType) {
    const args = event.args!;
    if (type == "ERC1155") {
      const tokenInfo: TokenInfo = { tokenId: +args[3].toString(), owner: args[2], blockNumber: event.blockNumber };
      const contract: ContractInfo = { chain: chain, address: event.address.toLowerCase(), type: type };
      await this.postchainManager.transferOwnerShips(contract, [tokenInfo]);
    } else {
      const tokenInfo = { tokenId: +args[2].toString(), owner: args[1], blockNumber: event.blockNumber };
      const contract: ContractInfo = { chain: chain, address: event.address.toLowerCase(), type: type };
      await this.postchainManager.transferOwnerShips(contract, [tokenInfo]);
    }
  }
}
