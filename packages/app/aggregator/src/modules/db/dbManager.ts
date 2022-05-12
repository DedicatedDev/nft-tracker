import { Pool, PoolConfig } from "pg";
import { Observable } from "rxjs";
import { EventType, NewNFTsEvent } from "../../models/event";
import { NFT } from "../../models/nft";
import { Utils } from "../../utils/utils";
import { BaseEventService } from "../base/event-service";
import { BlockAggregator } from "../block_aggregator/blockAggregator";
import { BigNumber, ethers } from "ethers";

export class DBManager {
  private _pool: Pool = new Pool({
    host: "localhost",
    user: "postchain",
    port: 5432,
    password: "Lightmoon227",
    database: "postchain",
    max: 20,
    //connectionString: "postgres://user:password@hostname:port/dbname",
    idleTimeoutMillis: 30000,
  });
  aggregator?: BlockAggregator;
  constructor(aggregator: BlockAggregator, config?: PoolConfig) {
    this.aggregator = aggregator;
    if (config != undefined) {
      this._pool = new Pool(config);
    }
  }

  private _subscribeAggregator() {
    this.aggregator?.broad_cast.subscribe(async (items) => {
      await this.storeNFTs(items);
    });
  }

  public async init() {
    const client = await this._pool.connect();
    try {
      await client.query(`CREATE SCHEMA evm_bridge;`);
      await client.query(`
        CREATE TABLE evm_bridge.nfts (
          tx_id SERIAL,
          block_number BIGINT NOT NULL,
          token_id BIGINT NOT NULL,
          contract_address TEXT NOT NULL,
          metadata_url TEXT,
          sender TEXT,
          receiver TEXT,
          block_hash TEXT,
          tx_hash TEXT,
          UNIQUE(token_id,contract_address)
        );
      `);
    } catch (error) {
      console.log(error)
      //Utils.handlingError(error);
    }
    client.release();
    this._subscribeAggregator();
  }

  public async reset() {
    const client = await this._pool.connect();
    try {
      await client.query(`drop schema evm_bridge CASCADE;`);
      //await client.query(`drop SEQUENCE nft_id_seq CASCADE;`);
    } catch (error) {
      Utils.handlingError(error);
    }
    client.release();
    this._subscribeAggregator();
  }

  public async storeNFTs(nfts: NFT[]) {
    try {
      const client = await this._pool.connect();
      await Promise.all(
        nfts.map(async (nft) => {
          try {
            await client.query(`
                      INSERT INTO evm_bridge.nfts (
                        block_number,
                        token_id,
                        contract_address,
                        sender,
                        receiver,
                        block_hash,
                        metadata_url,
                        tx_hash
                      ) VALUES (
                        ${+nft.blockNumber.toString()},
                        ${+nft.tokenId.toString()},
                        '${nft.contractAddress.toString()}',
                        '${nft.from.toString()}',
                        '${nft.to.toString()}',
                        '${nft.blockHash.toString()}',
                        '${nft.metadataUrl.toString()}',
                        '${ethers.utils.solidityKeccak256(
                          ["string"],
                          [JSON.stringify(nft)]
                        )}') ON CONFLICT(token_id,contract_address)
                        DO UPDATE SET
                        block_number=${+nft.blockNumber.toString()},
                        token_id=${+nft.tokenId.toString()},
                        contract_address ='${nft.contractAddress.toString()}',
                        sender='${nft.from.toString()}',
                        receiver='${nft.to.toString()}',
                        block_hash='${nft.blockHash.toString()}',
                        metadata_url='${nft.metadataUrl.toString()}',
                        tx_hash='${ethers.utils.solidityKeccak256(["string"], [JSON.stringify(nft)])}'
                        WHERE evm_bridge.nfts.block_number > ${+nft.blockNumber.toString()};
                    `);
          } catch (error) {
            //console.log(error)
            Utils.handlingError(error);
          }
        })
      );
      client.release();
    } catch (error) {}
  }
  public async getNFTsByOwner(userWalletAddress: string) {
    const client = await this._pool.connect();
    //"0x12753244901f9E612A471c15C7E5336e813D2e0B"
    //SELECT * from evm_bridge.nfts WHERE receiver = '0x12753244901f9E612A471c15C7E5336e813D2e0B' AND block_number IN (SELECT MAX(block_number) FROM evm_bridge.nfts GROUP BY token_id,contract_address);
    try {
      const result = await client.query(`
                SELECT *, MAX(block_number) FROM evm_bridge.nfts WHERE receiver = '0x12753244901f9E612A471c15C7E5336e813D2e0B' GROUP BY token_id,contract_address;
              `);
      console.log(result);
    } catch (error) {
      Utils.handlingError(error);
    }
    client.release();
  }

  public async getNFTsByContract(contractAddress: string) {
    const client = await this._pool.connect();
    client.release();
  }
}
