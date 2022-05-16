"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opTransferOwnerShip = exports.opAddNewContract = void 0;
const ft3_lib_1 = require("ft3-lib");
function opAddNewContract(contract) {
    return new ft3_lib_1.Operation("bridge.add_contract", contract.chain, contract.pubkey.encodeByte(), contract.type);
}
exports.opAddNewContract = opAddNewContract;
function opTransferOwnerShip(contract, tokenId, owner) {
    return new ft3_lib_1.Operation("bridge.transfer_ownership", contract.chain, contract.pubkey.encodeByte(), tokenId, owner.encodeByte());
}
exports.opTransferOwnerShip = opTransferOwnerShip;
//# sourceMappingURL=operations.js.map