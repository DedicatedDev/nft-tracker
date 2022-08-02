import {
  ContractInfo,
  opAddNewContract,
  opSyncStatus,
  opBatchSyncStatus,
  opTransferComplexOwnerships,
  opTransferOwnership,
  opTransferOwnerships,
  opSyncBlockNumber,
  PostchainClient,
  Queries,
  SupportChainType,
  ChainSyncInfo,
} from "@evm/base";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import PromisePool from "@supercharge/promise-pool/dist";
import { Blockchain, Operation, User } from "ft3-lib";
import { retryAsync } from "ts-retry";
import { RETRY_OPTION } from "../const/retry-options";
import { Utils } from "../utils/utils";

export class PostchainManager {
  private static shared: PostchainManager;
  private _client!: Blockchain;
  private _user!: User;
  private constructor(client: Blockchain, user: User) {
    this._client = client;
    this._user = user;
  }
  static async init(): Promise<PostchainManager> {
    if (!PostchainManager.shared) {
      const init = await PostchainClient.getClient();
      const user = PostchainClient.createUser(process.env.ORACLE_ADMIN);
      this.shared = new PostchainManager(init.client, user);
    }
    return this.shared;
  }
  async addNewContract(contracts: ContractInfo[]) {
    const res = await PromisePool.withConcurrency(20)
      .for(contracts)
      .process(async (contract) => {
        return await this._client.call(opAddNewContract(contract), this._user);
      });
    Utils.handlingBatchError(res.errors);
  }

  async fetchContracts(): Promise<ContractInfo[]> {
    const res = await this._client.query(Queries.GetContracts, {});
    const contracts = res.map((json: Object) => {
      const obj = JSON.parse(JSON.stringify(json));
      const contractInfo: ContractInfo = {
        chain: obj.chain,
        address: `0x${obj.address}`.toLowerCase(),
        type: obj.type,
        lastBlockNumber: obj.last_block_number ?? 0,
      };
      return contractInfo;
    });
    return contracts;
  }

  async fetchLastSyncInfo(): Promise<ChainSyncInfo[]> {
    const res = await this._client.query(Queries.GetLastSyncInfo, {});
    const lastSync = res.map((json: Object) => {
      const obj = JSON.parse(JSON.stringify(json));
      const chainInfo: ChainSyncInfo = { chain: obj.chain, lastSyncBlock: obj.last_sync_block_number };
      return chainInfo;
    });
    return lastSync;
  }

  async syncBlockNumber(chain: SupportChainType, blockNumber: number) {
    const op = opSyncBlockNumber(chain, blockNumber);
    await this._treatOperation(op);
  }

  async transferOwnership(contract: ContractInfo, tokenId: number, to: string, lastBlockNumber: number) {
    const op = opTransferOwnership(contract, tokenId, to, lastBlockNumber);
    await this._treatOperation(op);
  }

  async transferOwnerShips(contract: ContractInfo, tokenInfo: TokenInfo[]) {
    const batchOp = opTransferOwnerships(contract, tokenInfo);
    await this._treatOperation(batchOp);
  }

  async transferComplexOwnerships(tokenInfo: TokenInfo[]) {
    const batchOp = opTransferComplexOwnerships(tokenInfo);
    await this._treatOperation(batchOp);
  }

  async updateSyncStatus(contract: ContractInfo, lastBlockNumber: number) {
    const op = opSyncStatus(contract, lastBlockNumber);
    await this._treatOperation(op);
  }
  async updateBatchSyncStatus(contracts: ContractInfo[]) {
    const op = opBatchSyncStatus(contracts);
    await this._treatOperation(op);
  }
  private async _treatOperation(op: Operation) {
    try {
      await retryAsync(async () => {
        await this._client.call(op, this._user);
      }, RETRY_OPTION);
    } catch (error) {
      Utils.handlingError(error);
    }
  }
}
