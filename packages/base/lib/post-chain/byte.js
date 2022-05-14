"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
String.prototype.encodeByte = function () {
    return Buffer.from(this, "utf-8");
};
String.prototype.decodeByte = function () {
    const data = this.match(/.{1,2}/g);
    const stringBuffer = Array.from(data);
    const realBuffer = Buffer.from(stringBuffer.map((buf) => +`0x${buf}`));
    return realBuffer.toString("utf-8");
};
//# sourceMappingURL=byte.js.map