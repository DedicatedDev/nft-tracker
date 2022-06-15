import { Operation } from "ft3-lib";
import { ContractInfo } from "models/contract";
import { TokenInfo } from "../models/tokenInfo";

export function opAddNewContract(contract: ContractInfo): Operation {
  return new Operation("bridge.add_contract", contract.chain, contract.address.encodeByte(), contract.type);
}

export function opTransferOwnerShip(
  contract: ContractInfo,
  tokenId: number,
  owner: string,
  blockNumber: number
): Operation {
  return new Operation(
    "bridge.transfer_ownership",
    contract.chain,
    contract.address.encodeByte(),
    tokenId,
    owner.encodeByte(),
    blockNumber
  );
}

export function opTransferOwnerShips(contract: ContractInfo, tokens: TokenInfo[]): Operation {
  const _tokens = tokens.map((token) => [token.tokenId, token.owner.encodeByte(), token.blockNumber]);
  return new Operation(
    "bridge.transfer_batch_ownership",
    contract.chain,
    contract.address.encodeByte(),
    contract.type,
    _tokens
  );
}

export function opTransferComplexOwnerShips(tokens: TokenInfo[]): Operation {
  const _tokens = tokens.map((token) => [
    token!.chain,
    token.contractAddress!.encodeByte(),
    token.type!,
    token.tokenId,
    token.owner.encodeByte(),
    token.blockNumber,
  ]);
  return new Operation("bridge.transfer_batch_complex_ownership", _tokens);
}

export function opRecordTraceStatus(contracts: ContractInfo[]): Operation {
  const data = contracts.map((contract) => [contract.chain, contract.address]);
  return new Operation("bridge.record_trace_status", data);
}
