"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfuraProvider = void 0;
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({
    path: path_1.default.join(__dirname, "../../../../", ".env"),
});
class InfuraProvider {
    providers(chain) {
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
        const provider = { providerType: chain, endpoints: { http: httpUrl, wss: "" } };
        return provider;
    }
}
exports.InfuraProvider = InfuraProvider;
//# sourceMappingURL=providers.js.map