import { MockOracle } from "./modules/mock-oracle/mock-oracle";
import { ContractInfo } from "@evm/base";
import { Utils } from "./utils/utils";

const start = async () => {
  const client = new MockOracle();
  await client.init();
  const mockContracts: ContractInfo[] = [
    // {
    //   chain: "eth_rinkeby",
    //   address: "0xBE9D1fCd7680Eb40afCF763BAD1a53aDb67Eb87A",
    //   type: "ERC1155",
    // },
    {
      chain: "eth_main",
      address: "0xb2a2c7fb3e326c5ef282cb78207fbd9dcba8e983",
      type: "ERC721",
    },
    // {
    //   chain: "eth_rinkeby",
    //   address: "0xBE9D1fCd7680Eb40afCF763BAD1a53aDb67Eb87C",
    //   type: "ERC1155",
    // },
  ];
  try {
    await client.saveNewContract(mockContracts);
  } catch (error) {
    Utils.handlingError(error)
  }
   await client.start();
};
start();
