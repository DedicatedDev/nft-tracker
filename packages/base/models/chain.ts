export interface ProviderInfo {
  providerType: SupportChainType;
  endpoints: { http: string; wss: string };
}

export type SupportChainType = "eth_main" | "eth_bsc" | "eth_rinkeby" | "eth_ropsten";
export const AllSupportChains: SupportChainType[] = ["eth_main", "eth_bsc", "eth_rinkeby", "eth_ropsten"];
