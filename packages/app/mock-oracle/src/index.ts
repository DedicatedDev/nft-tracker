import { spawn, Worker } from "threads";
import { BlockProcessorManager } from "./modules/block-processor/index";
import { ContractsEventFilterManager } from "./modules/event-filter";

const startModules = async () => {
  const contractEventFilter = await spawn<ContractsEventFilterManager>(new Worker("./modules/crons/index.ts"));
  await contractEventFilter.start();
  console.log(`Start ContractEventFilter:`);

  const blockProcessor = await spawn<BlockProcessorManager>(new Worker("./modules/block-processor/index"));
  await blockProcessor.sync();
  //console.log(`Start BlockProcessor: `);
  //await Thread.terminate(contractEventFilter);
};
startModules();
