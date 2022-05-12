import { MockOracle } from "./modules/mock-oracle/mock-oracle";
import { ContractInfo } from "@evm/base";

const start = async () => {
  const client = new MockOracle();
  await client.init();
  const mockContracts: ContractInfo[] = [
    {
      chain: "eth_rinkeby",
      pubkey: "0xBE9D1fCd7680Eb40afCF763BAD1a53aDb67Eb87A",
      type: "ERC1155",
    },
    {
      chain: "eth_rinkeby",
      pubkey: "0xBE9D1fCd7680Eb40afCF763BAD1a53aDb67Eb87B",
      type: "ERC1155",
    },
    {
      chain: "eth_rinkeby",
      pubkey: "0xBE9D1fCd7680Eb40afCF763BAD1a53aDb67Eb87C",
      type: "ERC1155",
    },
  ];
  await client.saveNewContract(mockContracts);
  await client.start();
};
start();
