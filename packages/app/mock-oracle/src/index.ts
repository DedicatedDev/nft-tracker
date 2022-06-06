import { MockOracle } from "./modules/mock-oracle/mock-oracle";
import { ContractInfo } from "@evm/base";
import { Utils } from "./utils/utils";
import { PostchainManager } from "./modules/mock-oracle/postchain-manager";

const start = async () => {
  const postchainManager = new PostchainManager();
  await postchainManager.init();
  const client = new MockOracle(postchainManager);
  const mockContracts: ContractInfo[] = [
    {
      chain: "eth_main",
      address: "0xb2a2c7fb3e326c5ef282cb78207fbd9dcba8e983",
      type: "ERC721",
    },
    {
      chain: "eth_rinkeby",
      address: "0xBE9D1fCd7680Eb40afCF763BAD1a53aDb67Eb87A",
      type: "ERC1155",
    },
  ];
  try {
    await postchainManager.addNewContract(mockContracts);
  } catch (error) {
    Utils.handlingError(error);
  }
  await client.start();
};
start();
