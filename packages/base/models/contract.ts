import { ethers } from "ethers";
import { SupportChainType } from "./chain";
export type NFTContractType = "ERC721" | "ERC1155" | "OTHER";
export interface ContractInfo {
  address: string;
  chain: SupportChainType;
  type: NFTContractType;
  lastBlockNumber?: number;
  instance?: ethers.Contract;
}
