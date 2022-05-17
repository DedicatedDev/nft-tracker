import { Operation } from "ft3-lib";
import { ContractInfo } from "models/contract";

export function opAddNewContract(contract: ContractInfo): Operation {
  return new Operation("bridge.add_contract", contract.chain, contract.pubkey.encodeByte(), contract.type);
}

export function opTransferOwnerShip(contract: ContractInfo, tokenId: number, owner: string): Operation {
  return new Operation(
    "bridge.transfer_ownership",
    contract.chain,
    contract.pubkey.encodeByte(),
    tokenId,
    owner.encodeByte()
  );
}