import { ContractInfo } from "@evm/base";
import { Utils } from "../utils/utils";
import { PostchainManager } from "./postchain-manager";

const saveMockContracts = async () => {
  const postchainManager = await PostchainManager.init();
  const addr = "0xBE9D1fCd7680Eb40afCF763BAD1a53aDb67Eb87A".toLowerCase();
  const mockContracts: ContractInfo[] = [
    //CryptoPunks
    {
      chain: "eth_main",
      address: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
      type: "ERC721",
    },
    //Bored Ape Yacht Club
    {
      chain: "eth_main",
      address: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
      type: "ERC721",
    },
    //CryptoPunksV1
    {
      chain: "eth_main",
      address: "0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d",
      type: "ERC721",
    },
    //CloneX
    {
      chain: "eth_main",
      address: "0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b",
      type: "ERC721",
    },

    //CloneX
    {
      chain: "eth_main",
      address: "0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b",
      type: "ERC721",
    },
    {
      chain: "eth_main",
      address: "0xb2a2c7fb3e326c5ef282cb78207fbd9dcba8e983",
      type: "ERC721",
    },
    {
      chain: "eth_main",
      address: "0x19b86299c21505cdf59ce63740b240a9c822b5e4",
      type: "ERC721",
    },
    {
      chain: "eth_main",
      address: "0xbce3781ae7ca1a5e050bd9c4c77369867ebc307e",
      type: "ERC721",
    },
    {
      chain: "eth_rinkeby",
      address: addr,
      type: "ERC1155",
    },
  ];
  try {
    await postchainManager.addNewContract(mockContracts);
  } catch (error) {
    Utils.handlingError(error);
  }
};
(async () => {
  await saveMockContracts();
})();
