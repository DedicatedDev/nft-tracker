import { SupportChainType } from "@evm/base";
import { ethers } from "ethers";

export interface ExtendedProvider {
  chain: SupportChainType;
  provider: ethers.providers.JsonRpcBatchProvider;
}
