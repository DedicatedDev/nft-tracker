import { SupportChainType, ProviderInfo } from "../models/chain";
import * as dotenv from "dotenv";
import path from "path";
import { ethers } from "ethers";
dotenv.config({
  path: path.join(__dirname, "../../../../", ".env"),
});
export namespace Web3Provider {
  export function getProviderInfo(chain: SupportChainType): ProviderInfo {
    let httpUrl = process.env.ETH_RINKEBY;
    let wssUrl = process.env.ETH_RINKEBY_WSS;
    switch (chain) {
      case "eth_main":
        httpUrl = process.env.ETH_MAIN;
        wssUrl = process.env.ETH_MAIN_WSS;
        break;
      case "eth_ropsten":
        httpUrl = process.env.ETH_ROPSTEN;
        wssUrl = process.env.ETH_ROPSTEN_WSS;
      case "eth_main":
        httpUrl = process.env.ETH_MAIN;
        wssUrl = process.env.ETH_MAIN_WSS;
      default:
        httpUrl = process.env.ETH_RINKEBY;
        wssUrl = process.env.ETH_RINKEBY_WSS;
        break;
    }
    const provider: ProviderInfo = { providerType: chain, endpoints: { http: httpUrl, wss: wssUrl } };
    return provider;
  }
  export function jsonRPCProvider(chain: SupportChainType): ethers.providers.JsonRpcProvider {
    const providerInfo = getProviderInfo(chain);
    return new ethers.providers.JsonRpcProvider(providerInfo.endpoints.http);
  }
  export function wssRPCProvider(chain: SupportChainType): ethers.providers.WebSocketProvider {
    const providerInfo = getProviderInfo(chain);
    return new ethers.providers.WebSocketProvider(providerInfo.endpoints.wss);
  }
}
