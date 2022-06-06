import { ContractInfo, opAddNewContract, PostChainClient, Queries, SupportChainType } from "@evm/base";
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

  async fetchContracts(chain: SupportChainType): Promise<string[]> {
    return await this._client.query(Queries.GetContracts, { chain: chain });
  }

  async transferOwnerShip(op: Operation[]) {
    const res = await PromisePool.for(op).process(async (op) => {
      return await this._client.call(op, this._user);
    });
    Utils.handlingBatchError(res.errors);
  }

  async transferOwnerShips(op: Operation) {
    try {
      await this._client.call(op, this._user);
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  async reportDigResult() {
    
  }
}
