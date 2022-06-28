import { Pool, spawn, Thread, Worker } from "threads";
import { EventListener } from "./modules/event-listener/index";
import { ContractsEventFilterWorker } from "./modules/event-filter";
import { BlockProcessorMode } from "./interface/block-processor-mode";
import chalk from "chalk";
const startModules = async () => {
  console.log(`\r🚀 ${chalk.bold.yellow(" Service Get Started.".toUpperCase())}`);
  const eventFilterPool = Pool(() => spawn<ContractsEventFilterWorker>(new Worker("./modules/event-filter/index.ts")));
  eventFilterPool.queue((eventFilter) => eventFilter());
  await eventFilterPool.completed();
  await eventFilterPool.terminate();
  const eventListener = await spawn<EventListener>(new Worker("./modules/event-listener/index"));
  await eventListener();
};
startModules();
