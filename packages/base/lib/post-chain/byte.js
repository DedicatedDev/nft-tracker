"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
String.prototype.encodeByte = function () {
    const encoder = new util_1.TextEncoder();
    return encoder.encode(this).join("");
};
String.prototype.decodeByte = function () {
    const encoder = new util_1.TextDecoder();
    return encoder.decode(this);
};
//# sourceMappingURL=byte.js.map