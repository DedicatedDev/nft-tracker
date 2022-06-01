import { Pool, PoolConfig } from "pg";
import { ethers } from "ethers";
import { Blockchain, Operation, User } from "ft3-lib";
import chalk from "chalk";
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
import { EVENT_LOG_SIZE_EXCEEDED } from "../../const/error";
import { MAXIMUM_COLLECT_NFTS, MAXIMUM_EVENT_SEARCH_DEEP } from "../../const/setting";
import { async } from "rxjs";
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
        const contractInfo: ContractInfo = { chain: obj.chain, address: `0x${obj.address}`, type: obj.type };
        return contractInfo;
      });
    this._getContracts(contracts);
    await this._fetchAllEvents();
    await this._watch();
  }
  async saveNewContract(contracts: ContractInfo[]) {
    const res = await PromisePool.withConcurrency(20)
      .for(contracts)
      .process(async (contract) => {
        return await this._client.call(opAddNewContract(contract), this.user);
      });
    Utils.handlingBatchError(res.errors);
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
        contractInfo.address,
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
          const events = await this._fetchEvent(contract.instance!, eventFilter); //await contract.instance!.queryFilter(eventFilter);
          return events.map((event) => this._treatEvent(event, contract)).flat();
        } else if (contract.type == "ERC721") {
          const eventFilter = contract.instance!.filters.Transfer();
          const events = await this._fetchEvent(contract.instance!, eventFilter); //await contract.instance!.queryFilter(eventFilter);
          return events.map((event) => this._treatEvent(event, contract)).flat();
        }
      });

    Utils.handlingBatchError(ownership.errors);
    const ops = ownership.results.flat().filter((op): op is Operation => !!op);
    await this._transferOwnerShip(ops);
  }

  private async _fetchEvent(contract: ethers.Contract, filter: ethers.EventFilter): Promise<ethers.Event[]> {
    let events: ethers.Event[] = [];
    try {
      events = await contract.queryFilter(filter);
    } catch (error) {
      if (error instanceof Error && error.message.includes(EVENT_LOG_SIZE_EXCEEDED)) {
        events = await this._paginationEvents(contract, filter, []);
      } else {
        Utils.handlingError(error);
      }
    }
    return events;
  }
  private async _paginationEvents(
    contract: ethers.Contract,
    filter: ethers.EventFilter,
    initialEvents: ethers.Event[],
    lastBlockNumber?: number,
    defaultSearchDeep?: number,
    maximumRetry?: number
  ): Promise<ethers.Event[]> {
    let events: ethers.Event[] = initialEvents;
    if (maximumRetry == null) {
      maximumRetry = 5;
    }
    if (lastBlockNumber == null) {
      lastBlockNumber = await contract.provider.getBlockNumber();
    }
    if (defaultSearchDeep == null) {
      defaultSearchDeep = MAXIMUM_EVENT_SEARCH_DEEP;
    }
    try {
      let lastEvents = await contract.queryFilter(filter, lastBlockNumber - defaultSearchDeep, "latest");
      events = events.concat(lastEvents);
      lastBlockNumber = lastBlockNumber - defaultSearchDeep;
      while (lastBlockNumber! > 0) {
        const startBlockNumber: number = lastBlockNumber - defaultSearchDeep;
        console.log(
          chalk.red(" BlockNumber: "),
          chalk.green(lastBlockNumber),
          chalk.red(" SearchDeep: "),
          chalk.green(defaultSearchDeep),
          chalk.red(" CollectedEvents: "),
          chalk.green(events.length),
          `\n`
        );
        lastEvents = await contract.queryFilter(filter, startBlockNumber, lastBlockNumber);
        events = events.concat(lastEvents);
        if (lastEvents.length == 0) {
          if (defaultSearchDeep < MAXIMUM_EVENT_SEARCH_DEEP && maximumRetry == 1) {
            defaultSearchDeep = startBlockNumber;
          } else if (defaultSearchDeep < MAXIMUM_EVENT_SEARCH_DEEP && maximumRetry > 1) {
            defaultSearchDeep = MAXIMUM_EVENT_SEARCH_DEEP;
          }
          maximumRetry -= 1;
        }
        if (maximumRetry < 0 || lastBlockNumber == 0 || events.length > MAXIMUM_COLLECT_NFTS) {
          lastBlockNumber = -1;
          break;
        }
        lastBlockNumber = startBlockNumber;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes(EVENT_LOG_SIZE_EXCEEDED)) {
        if (maximumRetry <= 0) {
          return events;
        }
        events = await this._paginationEvents(
          contract,
          filter,
          events,
          lastBlockNumber,
          Math.floor(defaultSearchDeep / 2),
          maximumRetry - 1
        );
      } else {
        Utils.handlingError(error);
      }
    }
    return events;
  }

  private async _watch() {
    this._contracts.map(async (contract) => {
      if (contract.type == "ERC1155") {
        const eventFilter = contract.instance!.filters.TransferSingle();
        contract.instance?.on(eventFilter, async (operator, from, to, tokenId) => {
          console.log("====================================");
          console.log(operator, from, to, tokenId);
          console.log("====================================");
          const lastBlockNumber = await contract.instance!.getBlockNumber();
          this._transferOwnerShip([opTransferOwnerShip(contract, tokenId, to, lastBlockNumber)]);
        });
      } else {
        const eventFilter = contract.instance!.filters.Transfer();
        contract.instance?.on(eventFilter, async (from, to, tokenId) => {
          console.log("====================================");
          console.log(from, from, to, tokenId);
          console.log("====================================");
          const lastBlockNumber = await contract.instance!.getBlockNumber();
          this._transferOwnerShip([opTransferOwnerShip(contract, tokenId, to, lastBlockNumber)]);
        });
      }
    });
  }

  private _treatEvent(event: ethers.Event, contractInfo: ContractInfo): Operation {
    const args = event.args!;
    if (contractInfo.type == "ERC1155") {
      return opTransferOwnerShip(contractInfo, +args[3].toString(), args[2], event.blockNumber);
    } else {
      return opTransferOwnerShip(contractInfo, +args[2], args[1], event.blockNumber);
    }
  }

  private async _transferOwnerShip(op: Operation[]) {
    const res = await PromisePool.withConcurrency(20)
      .for(op)
      .process(async (op) => {
        return await this._client.call(op, this.user);
      });
    Utils.handlingBatchError(res.errors);
  }
}
