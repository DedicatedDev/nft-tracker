import chalk from "chalk";
import { Utils } from "../../../utils/utils";
import { PostchainManager } from "../postchain-manager";
import { ContractsEventFilter } from "./contract-event-filter";
import cron from "node-cron";
let isInProcess: boolean = false;
const startContractsEventFilter = async () => {
  const postchainManager = await PostchainManager.init();
  const contracts = await postchainManager.fetchContracts();
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
    isInProcess = true;
  }
});
startContractsEventFilter();
