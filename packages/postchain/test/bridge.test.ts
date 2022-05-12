import { expect } from "chai";
import { Utils } from "./utils";

import {
  op,
  Postchain,
  SingleSignatureAuthDescriptor,
  FlagsType,
  User,
  KeyPair,
  Operation,
  Blockchain,
  Asset,
} from "ft3-lib";

describe("✅ bridge", async () => {
  let client: Blockchain;
  let chainId: string;
  beforeEach(async () => {
    const chain = await Utils.getClient();
    client = chain.client;
    chainId = chain.chainId;
  });

  it("add contracts", async () => {
    const keyPair = new KeyPair().makeKeyPair();
    const user = new User(
      keyPair,
      new SingleSignatureAuthDescriptor(keyPair.pubKey, [FlagsType.Account, FlagsType.Transfer])
    );
    await client.call(op("bridge.add_contract", "eth_bsc", keyPair.pubKey, "ERC1155"), user);
  });

  it("transfer ownership", async () => {
    const keyPair = new KeyPair().makeKeyPair();
    const user = new User(
      keyPair,
      new SingleSignatureAuthDescriptor(keyPair.pubKey, [FlagsType.Account, FlagsType.Transfer])
    );
    const encoder = new TextEncoder();
    const bytes = encoder.encode(keyPair.pubKey).join("");
    console.log("====================================");
    console.log(bytes);
    console.log("====================================");
    await client.call(op("bridge.transfer_ownership", "eth_main", bytes, 1, bytes), user);
  });
});
