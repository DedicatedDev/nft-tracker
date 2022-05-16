"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
String.prototype.encodeByte = function () {
    const rel = /^#[0-9A-F]{6}$/i;
    if (rel.test(this)) {
        return Buffer.from(this, "hex");
    }
    else {
        if (this.includes("0x")) {
            return Buffer.from(this.slice(2, this.length), "hex");
        }
        return Buffer.from(this, "utf-8");
    }
};
String.prototype.decodeByte = function () {
    const data = this.match(/.{1,2}/g);
    const stringBuffer = Array.from(data);
    const realBuffer = Buffer.from(stringBuffer.map((buf) => +`0x${buf}`));
    return realBuffer.toString("hex");
};
//# sourceMappingURL=byte.js.map