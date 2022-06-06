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
  opTransferOwnerShips,
} from "@evm/base";
import { PromisePool } from "@supercharge/promise-pool";
import * as dotenv from "dotenv";
import path from "path";
import { Utils } from "../../utils/utils";
import { EVENT_LOG_SIZE_EXCEEDED } from "../../const/error";
import { MAXIMUM_COLLECT_NFTS, MAXIMUM_EVENT_SEARCH_DEEP } from "../../const/setting";
import { async } from "rxjs";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
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
    // console.log('====================================');
    // console.log(res);
    // console.log('====================================');
    const contracts = res.results
      .filter((items) => items.length != 0)
      .flat()
      .map((json) => {
        const obj = JSON.parse(JSON.stringify(json));
        const contractInfo: ContractInfo = {
          chain: obj.chain,
          address: `0x${obj.address}`,
          type: obj.type,
          lastBlockNumber: obj.last_block_number,
          minedBlockNumber: obj.mined_block_number,
          mined: obj.mined,
        };
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
          await this._fetchEvent(contract, eventFilter); //await contract.instance!.queryFilter(eventFilter);
          //return events.map((event) => this._treatEvent(event, contract)).flat();
        } else if (contract.type == "ERC721") {
          const eventFilter = contract.instance!.filters.Transfer();
          await this._fetchEvent(contract, eventFilter); //await contract.instance!.queryFilter(eventFilter);
          //return events.map((event) => this._treatEvent(event, contract)).flat();
        }
      });

    Utils.handlingBatchError(ownership.errors);
    //const ops = ownership.results.flat().filter((op): op is Operation => !!op);
    //await this._transferOwnerShip(ops);
  }
  private async _treatEvents(events: ethers.Event[], contract: ContractInfo) {
    const tokenInfo = events.map((event) => this._treatEvent(event, contract));
    const batchOperation = opTransferOwnerShips(contract, tokenInfo);
    await this._transferOwnerShips(batchOperation);
  }

  private async _fetchEvent(contract: ContractInfo, filter: ethers.EventFilter) {
    const currentBlockNumber = await contract.instance!.provider.getBlockNumber();
    await this._improvedPaginationEvents(contract, filter, currentBlockNumber, contract.lastBlockNumber!);
    await this._improvedPaginationEvents(contract, filter, contract.lastBlockNumber!, 0);
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
      events = events.concat(lastEvents.reverse());
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
        lastEvents = (await contract.queryFilter(filter, startBlockNumber, lastBlockNumber)).sort();
        events = events.concat(lastEvents);
        if (lastEvents.length == 0) {
          if (defaultSearchDeep < MAXIMUM_EVENT_SEARCH_DEEP && maximumRetry == 1) {
            defaultSearchDeep = startBlockNumber;
          } else if (defaultSearchDeep < MAXIMUM_EVENT_SEARCH_DEEP && maximumRetry > 1) {
            defaultSearchDeep = MAXIMUM_EVENT_SEARCH_DEEP;
          }
        }
        if (maximumRetry < 0 || lastBlockNumber == 0) {
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

  private async _improvedPaginationEvents(
    contract: ContractInfo,
    filter: ethers.EventFilter,
    lastBlockNumber: number,
    endBlockNumber: number,
    defaultSearchDeep?: number,
    maximumRetry?: number
  ) {
    if (maximumRetry == null) {
      lastBlockNumber = await contract.instance!.provider.getBlockNumber();
      maximumRetry = Math.floor(Math.log2(lastBlockNumber));
    }

    if (maximumRetry <= 0) {
      return;
    }

    if (lastBlockNumber == null) {
      lastBlockNumber = await contract.instance!.provider.getBlockNumber();
    }

    if (defaultSearchDeep == null) {
      defaultSearchDeep = lastBlockNumber;
    }

    try {
      while (lastBlockNumber! > endBlockNumber) {
        if (maximumRetry < 0) {
          break;
        }
        const startBlockNumber: number = lastBlockNumber - defaultSearchDeep;
        let lastEvents = await contract.instance!.queryFilter(filter, startBlockNumber, lastBlockNumber);
        console.log(
          chalk.red(" BlockNumber: "),
          chalk.green(lastBlockNumber),
          chalk.red(" SearchDeep: "),
          chalk.green(defaultSearchDeep),
          chalk.red(" CollectedEvents: "),
          chalk.green(lastEvents.length),
          `\n`
        );
        await this._treatEvents(lastEvents.reverse(), contract);
        if (lastEvents.length == 0) {
          maximumRetry = Math.floor(Math.log2(startBlockNumber));
          defaultSearchDeep = startBlockNumber;
          // if (defaultSearchDeep < MAXIMUM_EVENT_SEARCH_DEEP && maximumRetry == 1) {
          // } else if (defaultSearchDeep < MAXIMUM_EVENT_SEARCH_DEEP && maximumRetry > 1) {
          //   defaultSearchDeep = MAXIMUM_EVENT_SEARCH_DEEP;
          // }
        }
        lastBlockNumber = startBlockNumber;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes(EVENT_LOG_SIZE_EXCEEDED)) {
        await this._improvedPaginationEvents(
          contract,
          filter,
          lastBlockNumber,
          endBlockNumber,
          Math.floor(defaultSearchDeep / 2),
          maximumRetry - 1
        );
      } else {
        Utils.handlingError(error);
      }
    }
  }

  private async _watch() {
    this._contracts.map(async (contract) => {
      if (contract.type == "ERC1155") {
        const eventFilter = contract.instance!.filters.TransferSingle();
        contract.instance?.on(eventFilter, async (operator, from, to, tokenId) => {
          console.log("====================================");
          console.log(operator, from, to, tokenId);
          console.log("====================================");
          const lastBlockNumber = await contract.instance!.provider.getBlockNumber();
          //const op = opTransferOwnerShips(contract,[{tokenId: tokenId,owner: to,blockNumber:lastBlockNumber,}])
          //this._transferOwnerShips(op);
          this._transferOwnerShip([opTransferOwnerShip(contract, tokenId, to, lastBlockNumber)]);
        });
      } else {
        const eventFilter = contract.instance!.filters.Transfer();
        contract.instance?.on(eventFilter, async (from, to, tokenId) => {
          console.log("====================================");
          console.log(from, from, to, tokenId);
          console.log("====================================");
          const lastBlockNumber = await contract.instance!.provider.getBlockNumber();
          this._transferOwnerShip([opTransferOwnerShip(contract, tokenId, to, lastBlockNumber)]);
        });
      }
    });
  }

  // private _treatEvent(event: ethers.Event, contractInfo: ContractInfo): Operation {
  //   const args = event.args!;
  //   if (contractInfo.type == "ERC1155") {
  //     return opTransferOwnerShip(contractInfo, +args[3].toString(), args[2], event.blockNumber);
  //   } else {
  //     return opTransferOwnerShip(contractInfo, +args[2], args[1], event.blockNumber);
  //   }
  // }

  private _treatEvent(event: ethers.Event, contractInfo: ContractInfo): TokenInfo {
    const args = event.args!;
    if (contractInfo.type == "ERC1155") {
      return { tokenId: +args[3].toString(), owner: args[2], blockNumber: event.blockNumber };
      //return opTransferOwnerShip(contractInfo, +args[3].toString(), args[2], event.blockNumber);
    } else {
      return { tokenId: +args[2], owner: args[1], blockNumber: event.blockNumber };
      //return opTransferOwnerShip(contractInfo, +args[2], args[1], event.blockNumber);
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

  private async _transferOwnerShips(op: Operation) {
    try {
      await this._client.call(op, this.user);
    } catch (error) {
      Utils.handlingError(error);
    }

    // const res = await PromisePool.withConcurrency(20)
    //   .for(op)
    //   .process(async (op) => {
    //     return ;
    //   });
    // Utils.handlingBatchError(res.errors);
  }
}
