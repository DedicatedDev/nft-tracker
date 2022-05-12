import { BigNumber, BigNumberish, BytesLike } from "ethers";

export interface NFT {
    contractAddress:BytesLike,
    tokenId:BigNumber,
    metadataUrl:string,
    from:BytesLike,
    to:BytesLike,
    blockNumber:BigNumberish,
    blockHash: BigNumberish
}