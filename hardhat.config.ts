import * as dotenv from "dotenv";
dotenv.config();

import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
// import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/types";
import "./tasks/tasks";

const HARDHAT_FORK_URL: string = process.env.HARDHAT_FORK_URL as string;
const HARDHAT_CHAIN_ID = parseFloat(process.env.HARDHAT_CHAIN_ID as string) as number;

const AVALANCHE_MAINNET_URL: string = process.env.AVALANCHE_MAINNET_URL as string;
const AVALANCHE_CHAIN_ID = parseFloat(process.env.AVALANCHE_CHAIN_ID as string) as number;
const AVALANCHE_PRIVATE_KEY: string = process.env.AVALANCHE_PRIVATE_KEY as string;

const LOCALFORK_URL = process.env.LOCALFORK_URL as string || HARDHAT_FORK_URL
const LOCALFORK_CHAIN_ID = parseFloat(process.env.LOCALFORK_CHAIN_ID as string) as number || HARDHAT_CHAIN_ID
const LOCALFORK_PRIVATE_KEY = process.env.LOCALFORK_PRIVATE_KEY as string || AVALANCHE_PRIVATE_KEY

const BINANCE_MAINNET_URL: string = process.env.BINANCE_MAINNET_URL as string;
const FANTOM_MAINNET_URL: string = process.env.FANTOM_MAINNET_URL as string;

const BINANCE_PRIVATE_KEY: string = process.env.BINANCE_PRIVATE_KEY as string;
const FANTOM_PRIVATE_KEY: string = process.env.FANTOM_PRIVATE_KEY as string;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: "local",
  // defaultNetwork: "avax_mainnet",
  // defaultNetwork: "avax_testnet",
  // defaultNetwork: "bnb_mainnet",
  // defaultNetwork: "bnb_testnet",
  // defaultNetwork: "ftm_mainnet",
  // defaultNetwork: "ftm_testnet",
  solidity: "0.8.4",
  networks: {
    hardhat: {  // this is the default when executing "hardhat node"
      // chainId: 31337,
      chainId: HARDHAT_CHAIN_ID,
      gasPrice: 225000000000,
      throwOnTransactionFailures: false,
      loggingEnabled: true,
      forking: {
        url: HARDHAT_FORK_URL,
        enabled: true,
        // blockNumber: 2975762
        // blockNumber: 13919447
      },
    },
    local: {
      url: LOCALFORK_URL,
      gasPrice: 225000000000,
      chainId: LOCALFORK_CHAIN_ID,
      accounts: [
        LOCALFORK_PRIVATE_KEY,
      ]
    },
    // //region networks
    avax_mainnet: {
       url: AVALANCHE_MAINNET_URL as string,
       gasPrice: "auto",  // "auto" is the default (but also, don't want to overpay - same base price for each chain?)
       // gasPrice: 225000000000,
       chainId: 43114,
       loggingEnabled: true,
       accounts: [AVALANCHE_PRIVATE_KEY]
     },
    // avax_testnet: {
    //   url: "https://api.avax-test.network/ext/bc/C/rpc",
    //   gasPrice: 225000000000,
    //   chainId: 43113,
    //   accounts: [AVALANCHE_PRIVATE_KEY]
    // },
    // bnb_mainnet: {
    //   url: BINANCE_MAINNET_URL as string,
    //   chainId: 56,
    //   gasPrice: 20000000000,
    //   loggingEnabled: true,
    //   accounts: [BINANCE_PRIVATE_KEY]
    // },
    // bnb_testnet: {
    //   url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    //   chainId: 97,
    //   gasPrice: 20000000000,
    //   accounts: [BINANCE_PRIVATE_KEY]
    // },
    // ftm_mainnet: {
    //   url: FANTOM_MAINNET_URL as string,
    //   chainId: 250,
    //   gasPrice: 2000000000,
    //   loggingEnabled: true,
    //   accounts: [FANTOM_PRIVATE_KEY]
    // },
    // ftm_testnet: {
    //   url: "https://rpc.testnet.fantom.network",
    //   chainId: 4002,
    //   gasPrice: 2000000000,
    //   accounts: [FANTOM_PRIVATE_KEY]
    // }
    // //endregion
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
