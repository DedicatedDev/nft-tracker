import { AllSupportChains, ContractInfo } from "@evm/base";
import PromisePool from "@supercharge/promise-pool";
import chalk from "chalk";
import { PostchainManager } from "../postchain-manager";
import { BlockAggregator } from "./block-aggregator";

const startBlockAggregator = async () => {
  const postchainManager = new PostchainManager();
  await postchainManager.init();
  const res = await PromisePool.withConcurrency(20)
    .for(Array.from(AllSupportChains))
    .process(async (chain) => {
      return await postchainManager.fetchContracts(chain);
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
  const eventFilter = new BlockAggregator(contracts, postchainManager);
  eventFilter.start();
  process.stdout.write(chalk.bold.green("BlockAggregator APP STARTED.\n"));
};

startBlockAggregator();
