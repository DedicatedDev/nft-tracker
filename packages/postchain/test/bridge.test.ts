import { expect } from "chai";
import { Utils } from "./utils";
import { op, User, KeyPair, Blockchain, buffToHex } from "ft3-lib";
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
  });

  it("add contracts", async () => {
    await client.call(op("bridge.add_contract", "eth_bsc", oracleAdmin.keyPair.pubKey, "ERC1155"), oracleAdmin);
  });

  it("transfer ownership", async () => {
    const keyPair = new KeyPair().makeKeyPair();
    await client.call(op("bridge.transfer_ownership", "eth_main", keyPair.pubKey, 1, keyPair.pubKey), oracleAdmin);
  });

  it("query nfts by contract address(ethereum address)", async () => {
    //transfer new ownership
    const owner = "0x2216a73D1ECa928B5d3C0B1aA0754571cE03066a";
    await client.call(
      op("bridge.transfer_ownership", "eth_main", owner.encodeByte(), 1, owner.encodeByte()),
      oracleAdmin
    );
    //query contract according owner
    const result = await client.query("bridge.get_nfts_by_token", {
      chain: "eth_main",
      contract: Buffer.from(owner, "utf-8"),
    });
    expect(result.length).to.equal(1);
    const obj = JSON.parse(JSON.stringify(result));
    const chain = obj[0].chain;
    const ownerFromChain = obj[0].owner.decodeByte();
    expect(chain).to.equal("eth_main");
    expect(ownerFromChain).to.equal(owner);
  });

  it("query nfts by wallet address(ethereum address)", async () => {
    //transfer new ownership
    const owner = "0x2216a73D1ECa928B5d3C0B1aA0754571cE03066a";
    //query contract according owner
    const result = await client.query("bridge.get_user_nfts", {
      owner_id: owner.encodeByte(),
    });
    expect(result.length).to.equal(1);
    const obj = JSON.parse(JSON.stringify(result));
    const chain = obj[0].chain;
    expect(chain).to.equal("eth_main");
  });
});
