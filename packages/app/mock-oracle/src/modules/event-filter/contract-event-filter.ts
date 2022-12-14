import { ethers } from "ethers";
import chalk from "chalk";
import { Web3Provider, ContractInfo, ERC721ABI, ERC1155ABI } from "@evm/base";
import { PromisePool } from "@supercharge/promise-pool";
import * as dotenv from "dotenv";
import path from "path";
import { Utils } from "../../utils/utils";
import { EVENT_LOG_SIZE_EXCEEDED } from "../../const/error";
import { TokenInfo } from "@evm/base/lib/models/tokenInfo";
import { PostchainManager } from "../postchain-manager";
import { BlockListener } from "../block-listener";
dotenv.config({ path: path.join(__dirname, "../../../../../../../", ".env") });

export class ContractsEventFilter {
  private postchainManager: PostchainManager;
  private contractInfos: ContractInfo[] = [];
  constructor(contractInfos: ContractInfo[], txManager: PostchainManager) {
    this.contractInfos = contractInfos;
    this.postchainManager = txManager;
  }
  async start() {
    //get contract instance
    const initializedContracts = await this._getContractInstance(this.contractInfos);
    //trace past events from contract
    await this._trace(initializedContracts);
    await this._syncStatus();
  }

  private async _getContractInstance(contracts: ContractInfo[]): Promise<ContractInfo[]> {
    const initializedContracts = contracts.map((contractInfo) => {
      const provider = Web3Provider.jsonRPCProvider(contractInfo.chain);
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
    try {
      await this._getEvents(contract, filter, contract.lastBlockNumber ?? 0);
    } catch (error) {
      Utils.handlingError(error);
    }
  }

  private _treatEvent(event: ethers.Event, contractInfo: ContractInfo): TokenInfo {
    const args = event.args!;
    if (contractInfo.type == "ERC1155") {
      return { tokenId: +args[3].toString(), owner: args[2], blockNumber: event.blockNumber };
    } else {
      return { tokenId: +args[2].toString(), owner: args[1], blockNumber: event.blockNumber };
    }
  }

  private async _treatEvents(events: ethers.Event[], contract: ContractInfo) {
    const tokenInfo = events.map((event) => this._treatEvent(event, contract));
    await this.postchainManager.transferOwnerShips(contract, tokenInfo);
  }

  private async _getEvents(
    contract: ContractInfo,
    filter: ethers.EventFilter,
    startBlockNumber: number,
    maximumRetry?: number,
    searchDeep?: number
  ) {
    const syncedBlockNumber = await BlockListener.currentBlockNumber(contract.chain);
    if (searchDeep == null) {
      searchDeep = syncedBlockNumber - startBlockNumber;
    }
    if (maximumRetry == null) {
      maximumRetry = Math.floor(Math.log2(syncedBlockNumber - startBlockNumber));
    }
    try {
      while (startBlockNumber < syncedBlockNumber) {
        if (maximumRetry < 0) {
          break;
        }
        let endBlockNumber: number = startBlockNumber + searchDeep;
        let lastEvents = await contract.instance!.queryFilter(filter, startBlockNumber, endBlockNumber);
        console.log(
          `\r???? ${chalk.bold.yellow("SYNC MODE:")}`,
          chalk.red(" Chain:"),
          chalk.green(contract.chain.toUpperCase()),
          chalk.red(" Contract:"),
          chalk.green(contract.address),
          chalk.red(" BlockNumber: "),
          chalk.green(startBlockNumber),
          chalk.red(" SearchDeep: "),
          chalk.green(searchDeep),
          chalk.red(" CollectedEvents: "),
          chalk.green(lastEvents.length),
          `\n`
        );
        if (lastEvents.length < 5000) {
          searchDeep = 2 * searchDeep;
        } else {
          await this._treatEvents(lastEvents.reverse(), contract);
        }
        startBlockNumber = endBlockNumber;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes(EVENT_LOG_SIZE_EXCEEDED)) {
        await this._getEvents(contract, filter, startBlockNumber, maximumRetry - 1, Math.floor(searchDeep / 2));
      } else {
        Utils.handlingError(error);
      }
    }
  }
  async _syncStatus() {
    const res = await PromisePool.for(this.contractInfos).process(async (contract) => {
      const finalBlockNumber = await BlockListener.currentBlockNumber(contract.chain);
      contract.lastBlockNumber = finalBlockNumber;
      return contract;
    });
    await this.postchainManager.updateBatchSyncStatus(res.results);
  }
}
