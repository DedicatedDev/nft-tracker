import { Observable } from "rxjs";
import { allEventTypes, EventType, ServiceEvent, subscribeServiceEvent } from "../../models/event";
import { BlockAggregator } from "../block_aggregator/blockAggregator";

export interface BaseEventServiceInterface {
  subscribe: (eventTypes?: EventType[]) => Observable<ServiceEvent>;
}

export abstract class BaseEventService implements BaseEventServiceInterface {
  private _aggregator?: BlockAggregator;
  constructor(aggregator: BlockAggregator) {
    this._aggregator = aggregator;
  }
  /**
   * Events
   */
  subscribe(eventTypes: EventType[] = allEventTypes): Observable<ServiceEvent> {
    return subscribeServiceEvent({ aggregator: this._aggregator! }, eventTypes);
  }
}
