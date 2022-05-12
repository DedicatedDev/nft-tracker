import { TextDecoder, TextEncoder } from "util";

declare global {
  interface String {
    encodeByte(): string;
    decodeByte(): string;
  }
}
String.prototype.encodeByte = function (): string {
  const encoder = new TextEncoder();
  return encoder.encode(this).join("");
};
String.prototype.decodeByte = function (): string {
  const encoder = new TextDecoder();
  return encoder.decode(this);
};
export {};
