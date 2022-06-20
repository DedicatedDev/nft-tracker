// import chalk from "chalk";
// import cluster, { Worker } from "cluster";
// import os from "os";
// import { ContractsEventFilter } from "./src/modules/mock-oracle/crons/contract-event-filter";
// import { BlockProcessor } from "./src/modules/mock-oracle/listeners/block-processor";
// import { PostchainManager } from "./src/modules/mock-oracle/postchain-manager";
// const totalCPUs = os.cpus().length;
// let syncWorker: Worker;
// let listenWorker: Worker;
// const startOracle = async (): Promise<void> => {
//   const postchainManager = new PostchainManager();
//   await postchainManager.init();
//   const contracts = await postchainManager.fetchContracts();
//   if (cluster.isPrimary) {
//     syncWorker = cluster.fork("test");
//     listenWorker = cluster.fork();
//     syncWorker.on("connection", (socket) => {
//       const eventFilter = new ContractsEventFilter(contracts, postchainManager);
//       eventFilter.start();
//       console.log(chalk.green.bold("ContractsEventFilter APP STARTED"));
//     });
//     syncWorker.on("connection", (socket) => {
//       const blockFilter = new BlockProcessor(contracts, postchainManager);
//       blockFilter.start(contracts);
//       process.stdout.write(chalk.bold.green("BlockAggregator APP STARTED.\n"));
//     });
//   } else {
//     // console.log(cluster.worker.);
//     // switch (cluster.worker) {
//     //   case syncWorker:
//     //     const eventFilter = new ContractsEventFilter(contracts, postchainManager);
//     //     eventFilter.start();
//     //     console.log(chalk.green.bold("ContractsEventFilter APP STARTED"));
//     //     break;
//     //   case listenWorker:
//     //     const blockFilter = new BlockProcessor(contracts, postchainManager);
//     //     blockFilter.start(contracts);
//     //     process.stdout.write(chalk.bold.green("BlockAggregator APP STARTED.\n"));
//     //     break;
//     //   default:
//     //     break;
//     // }
//   }
// };
// startOracle();
