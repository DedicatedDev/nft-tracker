import { SupportChainType, ProviderInfo } from "../models/chain";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(__dirname, "../../../../", ".env"),
});
export class InfuraProvider {
  providers(chain: SupportChainType): ProviderInfo {
    let httpUrl = process.env.ETH_RINKEBY;
    switch (chain) {
      case "eth_main":
        httpUrl = process.env.ETH_MAIN;
        break;
      case "eth_ropsten":
        httpUrl = process.env.ETH_ROPSTEN;
      case "eth_main":
        httpUrl = process.env.ETH_MAIN;
      default:
        httpUrl = process.env.ETH_RINKEBY;
        break;
    }
    const provider: ProviderInfo = { providerType: chain, endpoints: { http: httpUrl, wss: "" } };
    return provider;
  }
}
