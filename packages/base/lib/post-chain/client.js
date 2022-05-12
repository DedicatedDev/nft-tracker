"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostChainClient = void 0;
const postchain_config_1 = require("../settings/postchain.config");
const ft3_lib_1 = require("ft3-lib");
const axios_1 = __importDefault(require("axios"));
exports.PostChainClient = {
    getClient: async () => {
        const res = await axios_1.default.get(`${postchain_config_1.PostChainConfig.networks.localhost.nodeUrl}/brid/iid_0`);
        return {
            client: await new ft3_lib_1.Postchain(postchain_config_1.PostChainConfig.networks.localhost.nodeUrl).blockchain(res.data),
            chainId: res.data,
        };
    },
    createUser: (privKey) => {
        const keyPair = privKey ? new ft3_lib_1.KeyPair(privKey) : new ft3_lib_1.KeyPair();
        return new ft3_lib_1.User(keyPair, new ft3_lib_1.SingleSignatureAuthDescriptor(keyPair.pubKey, [ft3_lib_1.FlagsType.Account, ft3_lib_1.FlagsType.Transfer]));
    },
};
//# sourceMappingURL=client.js.map