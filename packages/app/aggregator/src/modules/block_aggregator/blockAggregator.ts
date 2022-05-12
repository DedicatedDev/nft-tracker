import * as dotenv from "dotenv";
import { BigNumber, Contract, ethers } from "ethers";
import { PowerSet } from "../../interfaces/Set";
import { BlockAggregatorSetting, ContractType, NFTContractTx } from "../../models/block-aggregator";
import * as ERC721ABI from "../../abi/erc721.json";
import * as ERC1155ABI from "../../abi/erc1155.json";
import { NFT } from "../../models/nft";
import { Subject } from "rxjs";
import { Utils } from "../../utils/utils";
import cron from "node-cron";
import {parentPort} from "worker_threads"

dotenv.config();

export class BlockAggregator {
  broad_cast: Subject<NFT[]> = new Subject<NFT[]>();
  private _setting: BlockAggregatorSetting = {
    providerUrl: process.env.PROVIDER_WSS_URL ?? "",
    latestKnownBlockNumber: -1,
    /// this value has to be low than new block generate time of chain.
    blockTime: 10000,
  };

  provider: ethers.providers.WebSocketProvider;
  latestKnownBlockNumber: number = -1;
  tracedNFTContracts: PowerSet<NFTContractTx> = new PowerSet<NFTContractTx>();
  tokenIds: Map<string, Set<BigNumber>> = new Map<string, Set<BigNumber>>();

  constructor(setting?: BlockAggregatorSetting) {
    if (setting != undefined) {
      this._setting = setting;
    }
    this.provider = new ethers.providers.WebSocketProvider(this._setting.providerUrl);
    this.latestKnownBlockNumber = this._setting.latestKnownBlockNumber;
  }
  async processBlock(blockNumber: number) {
    const block = await this.provider.getBlockWithTransactions(blockNumber);
    await Promise.all(
      block.transactions.map(async (tx) => {
        try {
          const confirmedTx = await tx.wait();
          confirmedTx.logs.map((log) => {
            if (
              log.topics.includes(ethers.utils.solidityKeccak256(["string"], ["Transfer(address,address,uint256)"])) &&
              log.topics.length == 4
            ) {
              const decoder = new ethers.utils.AbiCoder();
              //const from = decoder.decode(["address"], log.topics[1]);
              //const to = decoder.decode(["address"], log.topics[2]);

              const tokenId: BigNumber = decoder.decode(["uint256"], log.topics[3])[0].toNumber();
              const contractAddress = log.address.toLowerCase();

              this.tracedNFTContracts.add({
                contractType: ContractType.ERC721,
                address: log.address.toLowerCase(),
                blockNumber: log.blockNumber,
                blockHash: log.blockHash,
                from: confirmedTx.from,
                to: confirmedTx.to,
                equals: (other) => other.address == log.address.toLowerCase(),
              });
              let items = this.tokenIds.get(contractAddress) ?? new Set<BigNumber>();
              items.add(tokenId);
              this.tokenIds.set(contractAddress, items);
            } else if (
              log.topics.includes(
                ethers.utils.solidityKeccak256(["string"], ["TransferSingle(address,address,address,uint256,uint256)"])
              )
            ) {
              const decoder = new ethers.utils.AbiCoder();
              //const operator = decoder.decode(["address"], log.topics[0]);
              //const from = decoder.decode(["address"], log.topics[1]);
              //const owner = decoder.decode(["address"], log.topics[2]);
              const tokenId: BigNumber = decoder.decode(["uint256"], log.topics[3][0]).toNumber();
              //const amount = decoder.decode(["uint256"], log.topics[4]);
              const contractAddress = log.address.toLowerCase();
              this.tracedNFTContracts.add({
                contractType: ContractType.ERC1155,
                address: log.address.toLowerCase(),
                blockNumber: log.blockNumber,
                blockHash: log.blockHash,
                from: confirmedTx.from,
                to: confirmedTx.to,
                equals: (other) => other.address == log.address.toLowerCase(),
              });
              let items = this.tokenIds.get(contractAddress) ?? new Set<BigNumber>();
              items.add(tokenId);
              this.tokenIds.set(contractAddress, items);
            }
          });
        } catch (error) {
          Utils.handlingError(error);
        }
      })
    );

    //Fetch Metadata
    const nfts = Array.from(this.tracedNFTContracts.values());

    try {
      let newNFTtx: NFT[] = [];
      await Promise.all(
        nfts.map(async (nftTx) => {
          if (nftTx.contractType == ContractType.ERC721) {
            const contract = new Contract(nftTx.address.toString(), ERC721ABI.abi, this.provider);
            const _tokenIds = [...(this.tokenIds.get(nftTx.address.toString()) ?? new Set<BigNumber>())];
            await Promise.all(
              _tokenIds.map(async (tokenId) => {
                try {
                  const metadataUrl = await contract.tokenURI(BigNumber.from(tokenId));
                  const newNFT: NFT = {
                    tokenId: tokenId,
                    metadataUrl: metadataUrl,
                    contractAddress: nftTx.address,
                    blockNumber: nftTx.blockNumber,
                    blockHash: nftTx.blockHash,
                    from: nftTx.from,
                    to: nftTx.to,
                  };
                  newNFTtx.push(newNFT);
                } catch (error) {}
              })
            );
          } else {
            const contract = new Contract(nftTx.address.toString(), ERC1155ABI.abi, this.provider);
            const _tokenIds = [...(this.tokenIds.get(nftTx.address.toString()) ?? new Set<BigNumber>())];
            await Promise.all(
              _tokenIds.map(async (tokenId) => {
                try {
                  const metadataUrl = await contract.uri(BigNumber.from(tokenId));
                  const newNFT: NFT = {
                    tokenId: tokenId,
                    metadataUrl: metadataUrl,
                    contractAddress: nftTx.address,
                    blockNumber: nftTx.blockNumber,
                    blockHash: nftTx.blockHash,
                    from: nftTx.from,
                    to: nftTx.to,
                  };
                  newNFTtx.push(newNFT);
                } catch (error) {}
              })
            );
          }
        })
      );
      this.broad_cast.next(newNFTtx);
      parentPort?.postMessage("finish block process")
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  async listenCurrentBlock() {
    this.provider.on("block", (blockNumber: number) => {
      process.stdout.write(
        `\r🕵  Current blockchain top: ${blockNumber}| Script is at:  ${BigNumber.from(this.latestKnownBlockNumber)}\n`
      );
      this.processBlock(blockNumber);
    });
  }
  async fetchOldBlock() {
    const currentBlockNumber: number = await this.provider.getBlockNumber();
    let startIndex = currentBlockNumber - 1;
    while (startIndex > 0) {
      process.stdout.write(
        `\rOld block loading: ${startIndex}: ⌛:${(
          ((currentBlockNumber - startIndex) * 100) /
          currentBlockNumber
        ).toFixed(2)}%...\n`
      );
      try {
        await this.processBlock(startIndex - 1);
      } catch (error) {}
      startIndex -= 1;
    }
    console.log("Old block loaded ✅");
  }
}
