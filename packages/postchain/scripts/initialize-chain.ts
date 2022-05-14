import { FlagsType, KeyPair, op, SingleSignatureAuthDescriptor, User } from "ft3-lib";
import { PostChainConfig as config } from "@evm/base";
import { Utils } from "../test/utils";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../../../", ".env") });
async function initialize() {
  const blockchain = (await Utils.getClient()).client;
  const user1 = createUser(process.env.ORACLE_ADMIN!.toString());
  try {
    await blockchain.call(op("bridge.register_admin", user1.keyPair.pubKey), user1);
  } catch (error) {
    console.log("====================================");
    Utils.handleError(error);
    console.log("====================================");
  }
}

function createUser(privKey: string) {
  const keyPair = privKey ? new KeyPair(privKey) : new KeyPair();
  return new User(keyPair, new SingleSignatureAuthDescriptor(keyPair.pubKey, [FlagsType.Account, FlagsType.Transfer]));
}
(async () => {
  await initialize();
})();
