import { Pool, PoolConfig } from "pg";
import { ethers } from "ethers";
import { Blockchain, Operation, User } from "ft3-lib";
import {
  InfuraProvider,
  Queries,
  PostChainClient,
  SupportChainType,
  AllSupportChains,
  ContractInfo,
  ERC721ABI,
  ERC1155ABI,
  opAddNewContract,
  opTransferOwnerShip,
} from "@evm/base";
import { PromisePool } from "@supercharge/promise-pool";
import * as dotenv from "dotenv";
import path from "path";
import { Utils } from "../../utils/utils";
dotenv.config({ path: path.join(__dirname, "../../../../../../", ".env") });
export class MockOracle {
  private _client!: Blockchain;
  private _chainId!: string;
  user!: User;
  private _contracts: ContractInfo[] = [];
  async init() {
    const init = await PostChainClient.getClient();
    this._client = init.client;
    this._chainId = init.chainId;
    this.user = PostChainClient.createUser(process.env.ORACLE_ADMIN);
  }
  async start() {
    const res = await PromisePool.withConcurrency(20)
      .for(Array.from(AllSupportChains))
      .process(async (chain) => {
        return await this.fetchContracts(chain);
      });
    const contracts = res.results
      .filter((items) => items.length != 0)
      .flat()
      .map((json) => {
        const obj = JSON.parse(JSON.stringify(json));
        const contractInfo: ContractInfo = { chain: obj.chain, pubkey: obj.pubkey, type: obj.type };
        return contractInfo;
      });
    this._getContracts(contracts);
    await this._fetchAllEvents();
    await this._watch();
  }
  async saveNewContract(contracts: ContractInfo[]) {
    try {
      await PromisePool.withConcurrency(20)
        .for(contracts)
        .process(async (contract) => {
          return await this._client.call(opAddNewContract(contract), this.user);
        });
    } catch (error) {
      console.log(error);
    }
  }
  async fetchContracts(chain: SupportChainType): Promise<string[]> {
    return await this._client.query(Queries.GetContracts, { chain: chain });
  }
  private async _getContracts(contracts: ContractInfo[]) {
    contracts.map((contractInfo) => {
      const infuraManager = new InfuraProvider();
      const infuraInfo = infuraManager.providers(contractInfo.chain);
      const provider = new ethers.providers.JsonRpcProvider(infuraInfo.endpoints.http);
      const contract = new ethers.Contract(
        contractInfo.pubkey,
        contractInfo.type == "ERC1155" ? ERC1155ABI.abi : ERC721ABI.abi,
        provider
      );
      contractInfo.instance = contract;
      this._contracts.push(contractInfo);
    });
  }
  private async _fetchAllEvents() {
    const ownership = await PromisePool.withConcurrency(20)
      .for(this._contracts)
      .process(async (contract) => {
        if (contract.type == "ERC1155") {
          const eventFilter = contract.instance!.filters.TransferSingle();
          const events = await contract.instance!.queryFilter(eventFilter);
          return events.map((event) => this._treatEvent(event, contract)).flat();
        } else if (contract.type == "ERC721") {
          const eventFilter = contract.instance!.filters.Transfer();
          const events = await contract.instance!.queryFilter(eventFilter);
          return events.map((event) => this._treatEvent(event, contract)).flat();
        }
      });
    try {
      const ops = ownership.results.flat().filter((op): op is Operation => !!op);
      await this._transferOwnerShip(ops);
    } catch (error) {
      Utils.handlingError(error);
    }
  }
  private async _watch() {
    this._contracts.map(async (contract) => {
      if (contract.type == "ERC1155") {
        const eventFilter = contract.instance!.filters.TransferSingle();
        contract.instance?.on(eventFilter, (operator, from, to, tokenId) => {
          console.log("====================================");
          console.log(operator, from, to, tokenId);
          console.log("====================================");
          this._transferOwnerShip([opTransferOwnerShip(contract, tokenId, to)]);
        });
      } else {
        const eventFilter = contract.instance!.filters.Transfer();
        contract.instance?.on(eventFilter, (from, to, tokenId) => {
          console.log("====================================");
          console.log(from, from, to, tokenId);
          console.log("====================================");
          this._transferOwnerShip([opTransferOwnerShip(contract, tokenId, to)]);
        });
      }
    });
  }

  private _treatEvent(event: ethers.Event, contractInfo: ContractInfo): Operation {
    const args = event.args!;
    if (contractInfo.type == "ERC1155") {
      return opTransferOwnerShip(contractInfo, +args[3].toString(), args[2]);
    } else {
      return opTransferOwnerShip(contractInfo, +args[2], args[1]);
    }
  }

  private async _transferOwnerShip(op: Operation[]) {
    const res = await PromisePool.withConcurrency(20)
      .for(op)
      .process(async (op) => {
        return await this._client.call(op, this.user);
      });
  }
}
