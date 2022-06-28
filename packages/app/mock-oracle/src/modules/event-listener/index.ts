import { PostchainManager } from "../postchain-manager";
import { expose } from "threads/worker";
import { spawn, Worker } from "threads";
import { SupportChainType } from "@evm/base";
import { BlockListenWorker } from "./worker/listen-worker";
import _ from "lodash";
import chalk from "chalk";

const _listenChain = async (chain: SupportChainType, whitelist: Set<string>) => {
  try {
    const listenWorker = await spawn<BlockListenWorker>(new Worker("./worker/listen-worker.ts"));
    await listenWorker(chain, whitelist);
  } catch (error) {
    console.log(error);
  }
};

export const eventListenWorker = async () => {
  const postchainManager = await PostchainManager.init();
  const contracts = await postchainManager.fetchContracts();
  console.log(
    chalk.bold.green("🔔 ContractsEventListener".toUpperCase()),
    chalk.bold.yellow("Get Started".toUpperCase())
  );
  const chains = _.uniq(contracts.map((contract) => contract.chain));
  chains.forEach((chain) => {
    const whitelist = contracts.filter((contract) => contract.chain === chain).map((contract) => contract.address);
    _listenChain(chain, new Set<string>(whitelist));
  });
};

export type EventListener = typeof eventListenWorker;
expose(eventListenWorker);
