import chalk from "chalk";
import { Utils } from "../../utils/utils";
import { PostchainManager } from "../postchain-manager";
import { ContractsEventFilter } from "./contract-event-filter";
import { expose } from "threads/worker";
import { BlockListener } from "../block-listener";
import _ from "lodash";

export const contractsEventFilterWorker = async () => {
  console.log(
    chalk.green.bold("🔔 ContractsEventFilter".toUpperCase()),
    chalk.yellow.bold("get started".toUpperCase())
  );
  const postchainManager = await PostchainManager.init();
  const contracts = await postchainManager.fetchContracts();
  const chains = _.uniqBy(contracts, "chain").map((c) => c.chain);
  BlockListener.init(chains);
  try {
    const eventFilter = new ContractsEventFilter(contracts, postchainManager);
    await eventFilter.start();
  } catch (error) {
    Utils.handlingError(error);
  }
};
export type ContractsEventFilterWorker = typeof contractsEventFilterWorker;
expose(contractsEventFilterWorker);
