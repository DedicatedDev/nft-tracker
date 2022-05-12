export interface ProviderInfo {
    providerType: SupportChainType;
    endpoints: {
        http: string;
        wss: string;
    };
}
export declare type SupportChainType = "eth_main" | "eth_bsc" | "eth_rinkeby" | "eth_ropsten";
export declare const AllSupportChains: SupportChainType[];
