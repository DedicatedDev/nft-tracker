import { Operation } from "ft3-lib";
import { ContractInfo } from "models/contract";
export declare function opAddNewContract(contract: ContractInfo): Operation;
export declare function opTransferOwnerShip(contract: ContractInfo, tokenId: number, owner: string): Operation;
