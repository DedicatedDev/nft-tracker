import { BigNumberish, BytesLike } from "ethers";


export interface BlockAggregatorSetting {
  providerUrl: string;
  latestKnownBlockNumber: number;
  blockTime: number;
}

export enum ContractType {
  ERC721 = "ERC721",
  ERC1155 = "ERC1155"
}

export interface NFTContractTx {
  contractType: ContractType,
  address: BytesLike,
  blockNumber: BigNumberish,
  blockHash: BigNumberish,
  from: BytesLike,
  to:BytesLike
  equals(other: NFTContractTx): boolean;
}

