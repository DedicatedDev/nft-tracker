import { BlockAggregator } from "./modules/block_aggregator/blockAggregator";
import { DBManager } from "./modules/db/dbManager";
const start = async () => {
  const service = new BlockAggregator();
  const dbManager = new DBManager(service);
  //await dbManager.reset();
  await dbManager.init();
  service.listenCurrentBlock();
  //service.fetchOldBlock();
};
start();
