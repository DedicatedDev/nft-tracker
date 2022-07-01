import { SupportChainType } from "./chain";
export interface ChainSyncInfo {
  chain: SupportChainType;
  lastSyncBlock: number;
  targetBlock?: number;
}
