import { ChainSyncInfo, Web3Provider } from "@evm/base";
import chalk from "chalk";
import { expose } from "threads";
import { Observable, Subject } from "threads/observable";
import { PostchainManager } from "../../postchain-manager";
import { UnitBlockProcessor } from "../processors/unit-block-processor";
let syncSubject = new Subject<{ syncInfo: ChainSyncInfo; whitelist: Set<string>; isSynced: boolean }>();
export const blockSyncWorker = {
  async start(syncInfo: ChainSyncInfo, contractList: Set<string>) {
    const provider = Web3Provider.jsonRPCProvider(syncInfo.chain);
    const postchainManager = await PostchainManager.init();
    let currentBlockNumber = await provider.getBlockNumber();
    provider.on("block", async (blockNumber: number) => {
      currentBlockNumber = blockNumber;
    });
    let lastSyncBlockNumber = syncInfo.lastSyncBlock;
    const unitBlockProcessor = new UnitBlockProcessor(contractList);
    while (lastSyncBlockNumber <= currentBlockNumber) {
      lastSyncBlockNumber++;
      console.log(
        `\r🕵 ${chalk.bold.yellow("SYNC MODE:")}:  ${chalk.bold.red(
          syncInfo.chain.toUpperCase()
        )}   : Script is at:  ${chalk.green(lastSyncBlockNumber)}`,
        chalk.red("Differ: "),
        chalk.green(currentBlockNumber - lastSyncBlockNumber),
        "\n"
      );
      
      await unitBlockProcessor.processBlock(syncInfo.chain, lastSyncBlockNumber);
      postchainManager.syncBlockNumber(syncInfo.chain, lastSyncBlockNumber);
    }
    syncSubject.next({ syncInfo: syncInfo, whitelist: contractList, isSynced: true });
    syncSubject.complete();
  },
  status() {
    return Observable.from(syncSubject);
  },
};

export type BlockSyncWorker = typeof blockSyncWorker;
expose(blockSyncWorker);
