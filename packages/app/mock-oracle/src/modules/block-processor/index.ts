import chalk from "chalk";
import { PostchainManager } from "../postchain-manager";
//import { BlockProcessorWorker } from "./worker/main-worker";
import { expose } from "threads/worker";
import { spawn, Thread, Worker, Pool } from "threads";
import { BlockProcessorMode } from "../../interface/block-processor-mode";
//import { BlockListenWorker } from "./worker/block-listen-worker";
import { BlockSyncWorker } from "./worker/sync-worker";
import PromisePool from "@supercharge/promise-pool";
import { ChainSyncInfo, ContractInfo, SupportChainType } from "@evm/base";
import { BlockListenWorker } from "./worker/listen-worker";
import _ from "lodash";
const listen = (contracts: ContractInfo[]) => {
  const chains = _.uniq(contracts.map((contract) => contract.chain));
  chains.forEach((chain) => {
    const whitelist = contracts.filter((contract) => contract.chain === chain).map((contract) => contract.address);
    _listenChain(chain, new Set<string>(whitelist));
  });
};

const _listenChain = async (chain: SupportChainType, whitelist: Set<string>) => {
  const listenWorker = await spawn<BlockListenWorker>(new Worker("./worker/listen-worker.ts"));
  listenWorker.start(chain, whitelist);
};

export const blockProcessorManager = {
  async sync() {
    const postchainManager = await PostchainManager.init();
    const syncInfos = await postchainManager.fetchLastSyncInfo();
    const contracts = await postchainManager.fetchContracts();
    const syncChains = syncInfos.map((syncInfo) => syncInfo.chain);
    const listenToContracts = contracts.filter((contract) => !syncChains.includes(contract.chain));

    if (syncInfos.length != 0) {
      const syncStatus = await PromisePool.withConcurrency(syncInfos.length)
        .for(syncInfos)
        .process(async (syncInfo) => {
          const blockListenWorker = await spawn<BlockSyncWorker>(new Worker("./worker/sync-worker.ts"));
          const whitelist = contracts
            .filter((contract) => contract.chain === syncInfo.chain)
            .map((contract) => contract.address);
          blockListenWorker.start(syncInfo, new Set(whitelist));
          return blockListenWorker;
        });
      syncStatus.results.map((sync) => {
        sync.status().subscribe((status) => {
          if (status.isSynced) {
            _listenChain(status.syncInfo.chain, status.whitelist);
          }
        });
      });
    }
    if (listenToContracts.length != 0) {
      listen(listenToContracts);
    }
  },
};
export type BlockProcessorManager = typeof blockProcessorManager;
expose(blockProcessorManager);
