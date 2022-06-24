import { BigNumber, ethers } from "ethers";
export const MAXIMUM_EVENT_SEARCH_DEEP = 200000;
export const MAXIMUM_COLLECT_NFTS = 200000;
export const ERC721TOKEN_TRANSFER_EVENT = ethers.utils.solidityKeccak256(
  ["string"],
  ["Transfer(address,address,uint256)"]
);
export const ERC1155TOKEN_TRANSFER_EVENT = ethers.utils.solidityKeccak256(
  ["string"],
  ["TransferSingle(address,address,address,uint256,uint256)"]
);
