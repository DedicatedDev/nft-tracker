declare global {
    interface String {
        encodeByte(): Buffer;
        decodeByte(): string;
    }
}
export {};
