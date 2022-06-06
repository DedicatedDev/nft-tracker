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
  return new Operation("bridge.transfer_batch_ownership", contract.chain, contract.address.encodeByte(), _tokens.toGTV());
}

// export function opTestParams(ids: number[]): Operation {
//   const ids_objs = ids.map((item) => {
//     return [item, "test", item];
//   });
//   return new Operation("bridge.test_params", ids_objs);
// }

// export function opTestParam(id: number): Operation {
//   return new Operation("bridge.test_params", id);
// }
