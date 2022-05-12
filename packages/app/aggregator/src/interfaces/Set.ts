import { NFTContractTx } from "../models/block-aggregator";

export class PowerSet<T extends NFTContractTx> extends Set<T> {
    add(value: T): this {
        let found = false;
        this.forEach(item => {
            if (value.equals(item)) {
                found = true;
            }
        });

        if (!found) {
            super.add(value);
        }
        return this;
    }
}