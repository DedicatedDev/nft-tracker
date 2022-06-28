import { SupportChainType, Web3Provider } from "@evm/base";
import { Subject, from } from "rxjs";

export class BlockListener {
  private static instance: BlockListener;
  private subject: Subject<Map<SupportChainType, number>> = new Subject<Map<SupportChainType, number>>();
  private blockNumbers: Map<SupportChainType, number> = new Map<SupportChainType, number>();
  private constructor(chains: SupportChainType[]) {
    chains.forEach((chain) => {
      const provider = Web3Provider.jsonRPCProvider(chain);
      provider.on("block", (blockNumber) => {
        this.blockNumbers.set(chain, blockNumber);
        this.subject.next(this.blockNumbers);
      });
    });
  }
  static init(chains: SupportChainType[]): BlockListener {
    if (!BlockListener.instance) {
      this.instance = new BlockListener(chains);
    }
    return this.instance;
  }
  static listen() {
    const observable = from(this.instance.subject);
    return observable;
  }
  static async currentBlockNumber(chain: SupportChainType): Promise<number> {
    if (!this.instance.blockNumbers.has(chain)) {
      const provider = Web3Provider.jsonRPCProvider(chain);
      return await provider.getBlockNumber();
    }
    return this.instance.blockNumbers.get(chain)!;
  }
}
