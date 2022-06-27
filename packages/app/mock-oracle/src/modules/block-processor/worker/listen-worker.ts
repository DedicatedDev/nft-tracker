import { ChainSyncInfo, SupportChainType, Web3Provider } from "@evm/base";
import chalk from "chalk";
import { expose } from "threads";
import { PostchainManager } from "../../postchain-manager";
import { UnitBlockProcessor } from "../processors/unit-block-processor";
export const blockListenWorker = {
  async start(chain: SupportChainType, contractList: Set<string>) {
    const postchainManager = await PostchainManager.init();
    const unitBlockProcessor = new UnitBlockProcessor(contractList);
    const provider = Web3Provider.jsonRPCProvider(chain);
    provider.on("block", async (blockNumber: number) => {
      console.log(
        `\r🕵 ${chalk.bold.yellow("LISTEN MODE:")}  ${chalk.bold.red(
          chain.toUpperCase()
        )}   : Script is at:  ${chalk.green(blockNumber)}\n`
      );
      await unitBlockProcessor.processBlock(chain, blockNumber);
      await postchainManager.syncBlockNumber(chain, blockNumber);
    });
  },
};

export type BlockListenWorker = typeof blockListenWorker;
expose(blockListenWorker);
