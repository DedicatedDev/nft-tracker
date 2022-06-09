import { Pool, PoolConfig } from "pg";
import { ethers } from "ethers";
import { Blockchain, Operation, User } from "ft3-lib";
import chalk from "chalk";
import {
  InfuraProvider,
  AllSupportChains,
  ContractInfo,
  ERC721ABI,
  ERC1155ABI,
  opTransferOwnerShip,
  opTransferOwnerShips,
} from "@evm/base";
import { PromisePool } from "@supercharge/promise-pool";
import * as dotenv from "dotenv";
import path from "path";
import { Utils } from "../../utils/utils";
import { EVENT_LOG_SIZE_EXCEEDED } from "../../const/error";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import { PostchainManager } from "./postchain-manager";
dotenv.config({ path: path.join(__dirname, "../../../../../../", ".env") });
export class MockOracle {
  private postchainManager: PostchainManager;
  constructor(txManager: PostchainManager) {
    this.postchainManager = txManager;
  }
  async start() {
    //fetch contract from postchain node
    const res = await PromisePool.withConcurrency(20)
      .for(Array.from(AllSupportChains))
      .process(async (chain) => {
        return await this.postchainManager.fetchContracts(chain);
      });
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
        };
        return contractInfo;
      });

    //get contract instance
    const initializedContracts = await this._getContractInstance(contracts);

    //trace past events from contract
    await this._trace(initializedContracts);

    //listen events from contract
    await this._watch(initializedContracts);
  }

  private async _getContractInstance(contracts: ContractInfo[]): Promise<ContractInfo[]> {
    const initializedContracts = contracts.map((contractInfo) => {
      const infuraManager = new InfuraProvider();
      const infuraInfo = infuraManager.providers(contractInfo.chain);
      const provider = new ethers.providers.JsonRpcProvider(infuraInfo.endpoints.http);
      const contract = new ethers.Contract(
        contractInfo.address,
        contractInfo.type == "ERC1155" ? ERC1155ABI.abi : ERC721ABI.abi,
        provider
      );
      contractInfo.instance = contract;
      return contractInfo;
    });
    return initializedContracts;
  }
  private async _trace(contracts: ContractInfo[]) {
    const ownership = await PromisePool.withConcurrency(20)
      .for(contracts)
      .process(async (contract) => {
        if (contract.type == "ERC1155") {
          const eventFilter = contract.instance!.filters.TransferSingle();
          await this._fetchEvent(contract, eventFilter);
        } else if (contract.type == "ERC721") {
          const eventFilter = contract.instance!.filters.Transfer();
          await this._fetchEvent(contract, eventFilter);
        }
      });

    Utils.handlingBatchError(ownership.errors);
  }

  /*
    Fetch past events from contract
  */
  private async _fetchEvent(contract: ContractInfo, filter: ethers.EventFilter) {
    const currentBlockNumber = await contract.instance!.provider.getBlockNumber();
    this._improvedPaginationEvents(contract, filter, currentBlockNumber, contract.lastBlockNumber! + 1);
    this._improvedPaginationEvents(contract, filter, contract.minedBlockNumber! - 1, 0);
  }

  /*
    Listen current event from contract
  */
  private async _watch(contracts: ContractInfo[]) {
    contracts.map(async (contract) => {
      if (contract.type == "ERC1155") {
        const eventFilter = contract.instance!.filters.TransferSingle();
        contract.instance?.on(eventFilter, async (operator, from, to, tokenId) => {
          console.log("===============ERC1155==============");
          console.log(operator, from, to, tokenId);
          console.log("====================================");
          const lastBlockNumber = await contract.instance!.provider.getBlockNumber();
          await this.postchainManager.transferOwnerShip(contract, tokenId, to, lastBlockNumber);
          await this.postchainManager.updateTraceStatus([contract]);
        });
      } else {
        const eventFilter = contract.instance!.filters.Transfer();
        contract.instance?.on(eventFilter, async (from, to, tokenId) => {
          console.log("===============ERC721===============");
          console.log(from, from, to, tokenId);
          console.log("====================================");
          const lastBlockNumber = await contract.instance!.provider.getBlockNumber();
          await this.postchainManager.transferOwnerShip(contract, tokenId, to, lastBlockNumber);
          await this.postchainManager.updateTraceStatus([contract]);
        });
      }
    });
  }

  private _treatEvent(event: ethers.Event, contractInfo: ContractInfo): TokenInfo {
    const args = event.args!;
    if (contractInfo.type == "ERC1155") {
      return { tokenId: +args[3].toString(), owner: args[2], blockNumber: event.blockNumber };
    } else {
      return { tokenId: +args[2], owner: args[1], blockNumber: event.blockNumber };
    }
  }

  private async _treatEvents(events: ethers.Event[], contract: ContractInfo) {
    const tokenInfo = events.map((event) => this._treatEvent(event, contract));
    await this.postchainManager.transferOwnerShips(contract, tokenInfo);
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
      maximumRetry = Math.floor(Math.log2(lastBlockNumber));
    }

    if (lastBlockNumber < endBlockNumber || maximumRetry <= 0) {
      return;
    }

    if (defaultSearchDeep == null) {
      defaultSearchDeep = lastBlockNumber;
    }

    try {
      while (lastBlockNumber! > endBlockNumber) {
        if (maximumRetry < 0) {
          break;
        }
        let startBlockNumber: number = lastBlockNumber - defaultSearchDeep;
        if (startBlockNumber < endBlockNumber) {
          startBlockNumber = endBlockNumber;
        }
        let lastEvents = await contract.instance!.queryFilter(filter, startBlockNumber, lastBlockNumber);
        console.log(
          chalk.red(" Chain:"),
          chalk.green(contract.chain),
          chalk.red(" Contract:"),
          chalk.green(contract.address),
          chalk.red(" BlockNumber: "),
          chalk.green(lastBlockNumber),
          chalk.red(" SearchDeep: "),
          chalk.green(defaultSearchDeep),
          chalk.red(" CollectedEvents: "),
          chalk.green(lastEvents.length),
          `\n`
        );

        if (lastEvents.length == 0) {
          maximumRetry = Math.floor(Math.log2(startBlockNumber));
          defaultSearchDeep = startBlockNumber;
        } else {
          await this._treatEvents(lastEvents.reverse(), contract);
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
}
