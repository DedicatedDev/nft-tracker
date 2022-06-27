import { ChainSyncInfo, contracts, SupportChainType, Web3Provider } from "@evm/base";
import chalk from "chalk";
import { ethers, EventFilter } from "ethers";
import { async } from "rxjs";
import { expose } from "threads";
import { ERC1155TOKEN_TRANSFER_EVENT, ERC721TOKEN_TRANSFER_EVENT } from "../../../const/setting";
import { PostchainManager } from "../../postchain-manager";
import { UnitBlockProcessor } from "../processors/unit-block-processor";
import { UnitEventProcessor } from "../processors/unit-event-processor";
export const blockListenWorker = async (chain: SupportChainType, contractList: Set<string>) => {
  const postchainManager = await PostchainManager.init();
  const unitBlockProcessor = new UnitBlockProcessor(contractList);
  const unitEventProcessor = new UnitEventProcessor(postchainManager);
  const provider = Web3Provider.jsonRPCProvider(chain);
  const eventER1155Filter: EventFilter = {
    topics: [ERC1155TOKEN_TRANSFER_EVENT],
  };
  const event721Filter: EventFilter = {
    topics: [ERC721TOKEN_TRANSFER_EVENT],
  };

  provider.on(eventER1155Filter, async (event: ethers.Event) => {
    if (contractList.has(event.address.toLowerCase())) {
      console.log(
        `\r🕵 ${chalk.bold.yellow("LISTEN MODE:")}  ${chalk.bold.red(
          chain.toUpperCase()
        )}   : Script is at:  ${chalk.green(event.blockNumber)}\n`
      );
      await unitEventProcessor.treatEvent(chain, event, "ERC1155");
    }
  });
  provider.on(event721Filter, async (event: ethers.Event) => {
    if (contractList.has(event.address.toLowerCase())) {
      console.log(
        `\r🕵 ${chalk.bold.yellow("LISTEN MODE:")}  ${chalk.bold.red(
          chain.toUpperCase()
        )}   : Script is at:  ${chalk.green(event.blockNumber)}\n`
      );
      await unitEventProcessor.treatEvent(chain, event, "ERC721");
    }
  });
};

export type BlockListenWorker = typeof blockListenWorker;
expose(blockListenWorker);
