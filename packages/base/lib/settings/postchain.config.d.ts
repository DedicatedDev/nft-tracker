export declare const PostChainConfig: {
    rell: {
        version: string;
        settings: {
            optimizer: {
                enabled: boolean;
                runs: number;
            };
        };
    };
    networks: {
        localhost: {
            nodeUrl: string;
            vaultUrl: string;
            adminPrivKey: string;
            fileHub: {
                url: string;
                brid: string;
            };
        };
        testnet: {
            nodeUrl: string;
            fileHub: {
                url: string;
                brid: string;
            };
        };
    };
    mocha: {
        timeout: number;
    };
};
