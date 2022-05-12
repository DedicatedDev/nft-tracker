import { User } from "ft3-lib";
export declare const PostChainClient: {
    getClient: () => Promise<{
        client: import("ft3-lib").Blockchain;
        chainId: any;
    }>;
    createUser: (privKey?: string) => User;
};
