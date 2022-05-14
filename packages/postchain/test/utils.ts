import { PostChainConfig as config } from "@evm/base";
import { FlagsType, KeyPair, Postchain, SingleSignatureAuthDescriptor, User } from "ft3-lib";
import axios from "axios";
export const Utils = {
  getClient: async () => {
    const res = await axios.get(`${config.networks.localhost.nodeUrl}/brid/iid_0`);
    return {
      client: await new Postchain(config.networks.localhost.nodeUrl).blockchain(res.data),
      chainId: res.data,
    };
  },

  createUser: (privKey?: string) => {
    const keyPair = privKey ? new KeyPair(privKey) : new KeyPair();
    return new User(
      keyPair,
      new SingleSignatureAuthDescriptor(keyPair.pubKey, [FlagsType.Account, FlagsType.Transfer])
    );
  },
  handleError: (error: any) => {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log("Unexpected error!");
    }
  },
};
