import { AllSupportChains, ContractInfo } from "@evm/base";
import PromisePool from "@supercharge/promise-pool";
import chalk from "chalk";
import { Utils } from "../../../utils/utils";
import { PostchainManager } from "../postchain-manager";
import { ContractsEventFilter } from "./contract-event-filter";
import cron from "node-cron";
let isInProcess: boolean = false;
const startContractsEventFilter = async () => {
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
  try {
    const eventFilter = new ContractsEventFilter(contracts, postchainManager);
    console.log(chalk.green.bold("ContractsEventFilter APP STARTED"));
    await eventFilter.start();
  } catch (error) {
    Utils.handlingError(error);
  }
  isInProcess = false;
};
cron.schedule("20 10 * * *", async () => {
  if (!isInProcess) {
    startContractsEventFilter();
    isInProcess = true
  }
});
startContractsEventFilter();
