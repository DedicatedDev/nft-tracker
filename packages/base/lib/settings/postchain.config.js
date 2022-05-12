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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostChainConfig = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.PostChainConfig = {
    rell: {
        version: "0.10.7",
        settings: {
            optimizer: {
                enabled: true,
                runs: 1,
            },
        },
    },
    networks: {
        localhost: {
            nodeUrl: "http://127.0.0.1:7740",
            vaultUrl: "https://dev.vault.chromia-development.com",
            adminPrivKey: "854D8402085EC5F737B1BE63FFD980981EED2A0DA5FAC6B4468CB1F176BA0321",
            fileHub: {
                url: "https://gl90tpkjck.execute-api.eu-central-1.amazonaws.com/dev/",
                brid: "9C6BFD0B96803A131C1EED2ED773097E2DB5B4103B7CBD5CD23701D1F1D43C02",
            },
        },
        testnet: {
            //brid: "DCF77142C1E4606D24976AF4893E48F4E745F37A0D39756D94EEDD5E9BBEDA6A",
            nodeUrl: "https://dev.mod-node.chromia-development.com",
            //vaultUrl: "https://dev.vault.chromia-development.com",
            //adminPrivKey: process.env.ADMIN_PRIV_KEY,
            fileHub: {
                url: "https://gl90tpkjck.execute-api.eu-central-1.amazonaws.com/dev/",
                brid: "9C6BFD0B96803A131C1EED2ED773097E2DB5B4103B7CBD5CD23701D1F1D43C02",
            },
        },
    },
    mocha: {
        timeout: 60000,
    },
};
//# sourceMappingURL=postchain.config.js.map