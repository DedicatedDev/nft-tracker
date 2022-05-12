import { Observable } from "rxjs";
import { NFT } from "./nft";
import { BlockAggregator } from "../modules/block_aggregator/blockAggregator";

export enum EventType {
  NewNFTs = "NewNFTs",
}

export interface NewNFTsEvent {
  eventType: EventType.NewNFTs;
  data: { nfts: NFT[] };
}

type EventTypeMap = {
  NewNFTs: NewNFTsEvent;
};

export type ServiceEvent = NewNFTsEvent;
export const allEventTypes: EventType[] = Object.values(EventType);

const eventHandling: {
  [T in EventType]: {
    listenerFn: (args: EventTypeMap) => ServiceEvent & { eventType: T };
  };
} = {
  [EventType.NewNFTs]: {
    listenerFn: (result) => ({
      eventType: EventType.NewNFTs,
      data: {
        nfts: result.NewNFTs.data.nfts,
      },
    }),
  },
};

export const subscribeServiceEvent: (
  service: { aggregator: BlockAggregator },
  eventTypes: EventType[]
) => Observable<ServiceEvent> = (service, eventTypes) =>
  new Observable<ServiceEvent>((observer) => {
    const listeners =
      Object.entries(eventHandling)
        .filter(([type]) => eventTypes.includes(type as EventType))
        .map(([, content]) => ({
          listener: (...args: any) => observer.next(content.listenerFn(args)),
        })) ?? [];
    return () =>
      listeners.forEach(({ listener }) => {
        console.log(listener);
      });
  });
