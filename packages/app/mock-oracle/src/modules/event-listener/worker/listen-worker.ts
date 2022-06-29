import { NFTContractType, SupportChainType, Web3Provider } from "@evm/base";
import chalk from "chalk";
import { ethers, EventFilter } from "ethers";
import { expose } from "threads";
import { ERC1155TOKEN_TRANSFER_EVENT, ERC721TOKEN_TRANSFER_EVENT } from "../../../const/setting";
import { PostchainManager } from "../../postchain-manager";
import { UnitEventProcessor } from "../processors/unit-event-processor";
export const blockListenWorker = async (chain: SupportChainType, contractList: Set<string>) => {
  const postchainManager = await PostchainManager.init();
  const unitEventProcessor = new UnitEventProcessor(postchainManager);
  const provider = Web3Provider.jsonRPCProvider(chain);

  const eventER1155Filter: EventFilter = {
    topics: [ERC1155TOKEN_TRANSFER_EVENT],
  };
  const event721Filter: EventFilter = {
    topics: [ERC721TOKEN_TRANSFER_EVENT],
  };

  [
    { type: "ERC1155", filter: eventER1155Filter },
    { type: "ERC721", filter: event721Filter },
  ].forEach(async ({ type, filter }) => {
    provider.on(filter, async (event: ethers.Event) => {
      if (contractList.has(event.address.toLowerCase())) {
        console.log(
          `\r🎧 ${chalk.bold.yellow("LISTEN MODE:")}  ${chalk.green(chain.toUpperCase())}`,
          " ",
          chalk.green(event.address.toLowerCase()),
          " ",
          chalk.green(event.blockNumber)
        );
        await unitEventProcessor.treatEvent(chain, event, type as NFTContractType);
      }
    });
  });
};

export type BlockListenWorker = typeof blockListenWorker;
expose(blockListenWorker);
