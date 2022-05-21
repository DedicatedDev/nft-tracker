import * as dotenv from "dotenv";
dotenv.config();
export const PostChainConfig = {
  rell: {
    version: "0.10.8",
  },
  networks: {
    localhost: {
      nodeUrl: "http://127.0.0.1:7740",
      vaultUrl: "https://dev.vault.chromia-development.com",
      adminPrivKey: "854D8402085EC5F737B1BE63FFD980981EED2A0DA5FAC6B4468CB1F176BA0321",
      fileHub: {
        url: "https://gl90tpkjck.execute-api.eu-central-1.amazonaws.com/dev/",
        brid: "9C6BFD0B96803A131C1EED2ED773097E2DB5B4103B7CBD5CD23701D1F1D43C02",
      },
    },
    testnet: {
      //brid: "DCF77142C1E4606D24976AF4893E48F4E745F37A0D39756D94EEDD5E9BBEDA6A",
      nodeUrl: "https://dev.mod-node.chromia-development.com",
      //vaultUrl: "https://dev.vault.chromia-development.com",
      //adminPrivKey: process.env.ADMIN_PRIV_KEY,
      fileHub: {
        url: "https://gl90tpkjck.execute-api.eu-central-1.amazonaws.com/dev/",
        brid: "9C6BFD0B96803A131C1EED2ED773097E2DB5B4103B7CBD5CD23701D1F1D43C02",
      },
    },
  },
  mocha: {
    timeout: 60000,
  },
};

