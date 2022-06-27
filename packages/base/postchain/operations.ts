import { Operation } from "ft3-lib";
import { SupportChainType } from "models/chain";
import { ContractInfo } from "models/contract";
import { TokenInfo } from "../models/tokenInfo";

export function opAddNewContract(contract: ContractInfo): Operation {
  return new Operation("bridge.add_contract", contract.chain, contract.address.encodeByte(), contract.type);
}

export function opTransferOwnership(
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

export function opTransferOwnerships(contract: ContractInfo, tokens: TokenInfo[]): Operation {
  const _tokens = tokens.map((token) => [token.tokenId, token.owner.encodeByte(), token.blockNumber]);
  return new Operation(
    "bridge.transfer_batch_ownership",
    contract.chain,
    contract.address.encodeByte(),
    contract.type,
    _tokens
  );
}

export function opTransferComplexOwnerships(tokens: TokenInfo[]): Operation {
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

export function opTraceSyncStatus(contracts: ContractInfo[]): Operation {
  const data = contracts.map((contract) => [contract.chain, contract.address]);
  return new Operation("bridge.update_contract_sync_status", data);
}

export function opSyncBlockNumber(chain: SupportChainType, lastSyncBlockNumber: number): Operation {
  if (lastSyncBlockNumber < 0) throw new Error("lastSyncBlockNumber must be greater than 0");
  return new Operation("bridge.update_chain_sync_status", chain, lastSyncBlockNumber);
}
