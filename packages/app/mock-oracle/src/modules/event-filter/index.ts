import chalk from "chalk";
import { Utils } from "../../utils/utils";
import { PostchainManager } from "../postchain-manager";
import { ContractsEventFilter } from "./contract-event-filter";
import { expose } from "threads/worker";

export const contractsEventFilterManager = {
  async start() {
    const postchainManager = await PostchainManager.init();
    const contracts = await postchainManager.fetchContracts();
    try {
      const eventFilter = new ContractsEventFilter(contracts, postchainManager);
      await eventFilter.start();
      console.log(chalk.green.bold("ContractsEventFilter APP STARTED"));
    } catch (error) {
      Utils.handlingError(error);
    }
  },
};
export type ContractsEventFilterManager = typeof contractsEventFilterManager;
expose(contractsEventFilterManager);
