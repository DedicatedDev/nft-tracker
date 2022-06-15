import { SupportChainType } from "./chain";

export interface TokenInfo {
  tokenId: number;
  owner: string;
  blockNumber: number;
  chain?: SupportChainType;
  contractAddress?: string;
  type?: string;
}
