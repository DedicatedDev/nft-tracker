declare global {
  interface String {
    encodeByte(): Buffer;
    decodeByte(): string;
  }
}
String.prototype.encodeByte = function (): Buffer {
  return Buffer.from(this, "utf-8");
};
String.prototype.decodeByte = function (): string {
  const data = this.match(/.{1,2}/g);
  const stringBuffer: string[] = Array.from(data!);
  const realBuffer = Buffer.from(stringBuffer.map((buf) => +`0x${buf}`));
  return realBuffer.toString("utf-8");
};
export {};
