declare global {
  interface String {
    encodeByte(): Buffer;
    decodeByte(): string;
  }
}
String.prototype.encodeByte = function (): Buffer {
  const rel = /^#[0-9A-F]{6}$/i;
  if (rel.test(this)) {
    return Buffer.from(this, "hex");
  }
  if (this.includes("0x")) {
    return Buffer.from(this.slice(2, this.length), "hex");
  }
  return Buffer.from(this, "hex");
};
String.prototype.decodeByte = function (): string {
  const data = this.match(/.{1,2}/g);
  const stringBuffer: string[] = Array.from(data!);
  const realBuffer = Buffer.from(stringBuffer.map((buf) => +`0x${buf}`));
  return realBuffer.toString("hex");
};
export {};
