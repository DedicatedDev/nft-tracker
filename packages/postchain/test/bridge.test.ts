import { expect } from "chai";
import { Utils } from "./utils";
import {
  op,
  User,
  KeyPair,
  Blockchain
} from "ft3-lib";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../../../", ".env") });

describe("✅ bridge", async () => {
  let client: Blockchain;
  let chainId: string;
  let oracleAdmin: User;
  beforeEach(async () => {
    const chain = await Utils.getClient();
    client = chain.client;
    chainId = chain.chainId;
    
    //register admin
    oracleAdmin = Utils.createUser(process.env.ORACLE_ADMIN);
    //await client.call(op("bridge.add_contract", "eth_bsc", oracleAdmin.keyPair.pubKey, "ERC1155"), oracleAdmin);
  });

  it("add contracts", async () => {
    await client.call(op("bridge.add_contract", "eth_bsc", oracleAdmin.keyPair.pubKey, "ERC1155"), oracleAdmin);
  });

  it("transfer ownership", async () => {
    const keyPair = new KeyPair().makeKeyPair();
    const encoder = new TextEncoder();
    const bytes = encoder.encode(keyPair.pubKey).join("");
    console.log("====================================");
    console.log(bytes);
    console.log("====================================");
    await client.call(op("bridge.transfer_ownership", "eth_main", bytes, 1, bytes), oracleAdmin);
  });
});
