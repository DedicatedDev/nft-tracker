import chalk from "chalk";
import { PostchainManager } from "../postchain-manager";
import { BlockProcessor } from "./block-processor";
const startBlockAggregator = async () => {
  const postchainManager = await PostchainManager.init();
  const contracts = await postchainManager.fetchContracts();
  const eventFilter = new BlockProcessor(contracts, postchainManager);
  eventFilter.start(contracts);
  process.stdout.write(chalk.bold.green("BlockAggregator APP STARTED.\n"));
};
startBlockAggregator();
