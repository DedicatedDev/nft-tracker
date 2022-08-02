declare global {
  interface String {
    encodeByte(): Buffer;
    decodeByte(): string;
    hexToBase64(): string;
  }
}

String.prototype.encodeByte = function (): Buffer {
  const rel = /^#[0-9A-F]{40}$/i;
  if (rel.test(this.toString())) {
    return Buffer.from(this, "hex");
  }
  if (this.startsWith("0x")) {
    return Buffer.from(this.slice(2, this.length), "hex");
  }
  return Buffer.from(this, "hex");
};

String.prototype.decodeByte = function (): string {
  return Buffer.from(this, "hex").toString("hex");
};
export {};
