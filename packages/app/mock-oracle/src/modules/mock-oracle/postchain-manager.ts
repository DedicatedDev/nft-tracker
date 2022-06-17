import {
  ContractInfo,
  opAddNewContract,
  opRecordTraceStatus,
  opTransferComplexOwnerships,
  opTransferOwnership,
  opTransferOwnerships,
  PostChainClient,
  Queries,
  SupportChainType,
} from "@evm/base";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import PromisePool from "@supercharge/promise-pool/dist";
import { Blockchain, Operation, User } from "ft3-lib";
import { Utils } from "../../utils/utils";

export class PostchainManager {
  private _client!: Blockchain;
  private _user!: User;
  async init() {
    const init = await PostChainClient.getClient();
    this._client = init.client;
    this._user = PostChainClient.createUser(process.env.ORACLE_ADMIN);
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
        address: `0x${obj.address}`,
        type: obj.type,
        lastBlockNumber: obj.last_block_number,
        minedBlockNumber: obj.mined_block_number,
      };
      return contractInfo;
    });
    return contracts;
  }

  async transferOwnership(contract: ContractInfo, tokenId: number, to: string, lastBlockNumber: number) {
    const op = opTransferOwnership(contract, tokenId, to, lastBlockNumber);
    try {
      await this._client.call(op, this._user);
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  async transferOwnerShips(contract: ContractInfo, tokenInfo: TokenInfo[]) {
    const batchOp = opTransferOwnerships(contract, tokenInfo);
    try {
      await this._client.call(batchOp, this._user);
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  async transferComplexOwnerships(tokenInfo: TokenInfo[]) {
    const batchOp = opTransferComplexOwnerships(tokenInfo);
    try {
      await this._client.call(batchOp, this._user);
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  async updateTraceStatus(contracts: ContractInfo[]) {
    const op = opRecordTraceStatus(contracts);
    await this._client.call(op, this._user);
  }
}
