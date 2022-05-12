declare global {
    interface String {
        encodeByte(): string;
        decodeByte(): string;
    }
}
export {};
