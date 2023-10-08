import * as dotenv from 'dotenv';

import GRAPEFINANCEVINEYARD_ABI from "../../ABI/GrapeFinanceVineyard.json";
import GRAPEFINANCEWINERY_ABI from "../../ABI/GrapeFinanceWinery.json";
import GRAPEFINANCENODE_ABI from "../../ABI/GrapeFinanceNode.json";
import GRAPEFINANCEWINENODE_ABI from "../../ABI/GrapeFinanceWineNode.json";
import RUBYMINE_ABI from "../../ABI/RubyMine.json";
import TRADERJOE_ABI from "../../ABI/TraderJoe.json";
import ERC20_ABI from "../../ABI/ERC20.json";
import MIM_ABI from "../../ABI/MIM.json";
import WAVAX_ABI from "../../ABI/WAVAX.json";
import GRAPE_ABI from "../../ABI/GRAPE.json";
import WINE_ABI from "../../ABI/WINE.json";
import NODE_GRAPE_ABI from "../../ABI/NodeGRAPE.json";
import NODE_WINE_ABI from "../../ABI/NodeWINE.json";
import {ChainRef} from "../classes/Context"

const path = require("path");
const envFilePath = path.resolve(__dirname, "../.env");
dotenv.config();

//region CONSTANTS
const PAYROLL_ADDRESS_AVAX_MICHAEL: string = process.env.PAYROLL_ADDRESS_AVAX_MICHAEL as string;
const PAYROLL_ADDRESS_AVAX_MATT: string = process.env.PAYROLL_ADDRESS_AVAX_MATT as string;
const PAYROLL_ADDRESS_AVAX_MUKHTAR: string = process.env.PAYROLL_ADDRESS_AVAX_MUKHTAR as string;
const PAYROLL_ADDRESS_AVAX_DAN: string = process.env.PAYROLL_ADDRESS_AVAX_DAN as string;


export interface Registry {

}

export class TaskRegistry implements Registry {
    private networks: Array<{ id: string; blockchain: string, networkType: string, nativeCurrency: string; }> = [
        {
            id: "avax_mainnet",
            blockchain: "avalanche",
            networkType: "mainnet",
            nativeCurrency: "AVAX"
        }
    ];

    private payrollAccounts: Array<{ id: string, address: string, amount: string }> = [
        {
            id: "michael",
            address: PAYROLL_ADDRESS_AVAX_MICHAEL,
            amount: "2500"
        },
        {
            id: "matt",
            address: PAYROLL_ADDRESS_AVAX_MATT,
            amount: "500"
        },
        {
            id: "mukhtar",
            address: PAYROLL_ADDRESS_AVAX_MUKHTAR,
            amount: "160"
        },
        {
            id: "dan",
            address: PAYROLL_ADDRESS_AVAX_DAN,
            amount: "600"
        }
    ];
    

    private tokens: Array<{ id: string, name: string, address: string, asset: string, blockchain: string, ABI: any; }> = [

        {
            id: "grape",
            name: "Grapefinance.app GRAPE Token",
            address: "0x5541D83EFaD1f281571B343977648B75d95cdAC2",
            asset: "GRAPE",
            blockchain: "avalanche",
            // ABI: GRAPE_ABI,
            ABI: ERC20_ABI
        },
        {
            id: "mim",
            name: "Abracadabra.money: MIM Token",
            address: "0x130966628846BFd36ff31a822705796e8cb8C18D",
            asset: "MIM",
            blockchain: "avalanche",
            ABI: MIM_ABI
        },
        {
            id: "usdc",
            name: "USDC",
            address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
            asset: "USDC",
            blockchain: "avalanche",
            ABI: ERC20_ABI
        },
        {
            id: "wavax",
            name: "Wrapped AVAX",
            address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
            asset: "WAVAX",
            blockchain: "avalanche",
            ABI: WAVAX_ABI
        },
        {
            id: "wine",
            name: "Grapefinance.app WINE Token",
            address: "0xC55036B5348CfB45a932481744645985010d3A44",
            asset: "WINE",
            blockchain: "avalanche",
            ABI: ERC20_ABI
        },
        {
            id: "grape-mim-lp",
            name: "Token Pair Grape-Mim",
            address: "0xb382247667fe8CA5327cA1Fa4835AE77A9907Bc8",
            asset: "GRAPE-MIM-LP",
            blockchain: "avalanche",
            ABI: ERC20_ABI
        },
        {
            id: "mim-wine-lp",
            name: "Token Pair Mim-Wine",
            address: "0x00cb5b42684da62909665d8151ff80d1567722c3",
            asset: "MIM-WINE-LP",
            blockchain: "avalanche",
            ABI: ERC20_ABI
        },
        {
            id: "grape-wine-lp",
            name: "Token Pair Grape-Wine",
            address: "0xd3d477df7f63a2623464ff5be6746981fded026f",
            asset: "GRAPE-WINE-LP",
            blockchain: "avalanche",
            ABI: ERC20_ABI
        },


    ];

    // 43114

    private chains: Array<ChainRef> = [
        {
            id: "avalanche",
            type: "mainnet",
            chainId: 43114,
            nativeToken: "AVAX"
        },
        {
            id: "avalanche",
            type: "testnet",
            chainId: 43113,
            nativeToken: "AVAX"
        },
        {
            id: "binance-smart-chain",
            type: "mainnet",
            chainId: 56,
            nativeToken: "BNB"
        },
        {
            id: "binance-smart-chain",
            type: "testnet",
            chainId: 97,
            nativeToken: "ETH"
        },
        {
            id: "ethereum",
            type: "mainnet",
            chainId: 1,
            nativeToken: "ETH"
        },
        {
            id: "goerli",
            type: "testnet",
            chainId: 5,
            nativeToken: "ETH"
        },
        {
            id: "sepolia",
            type: "testnet",
            chainId: 11155111,
            nativeToken: "ETH"
        },
        {
            id: "fantom",
            type: "mainnet",
            chainId: 250,
            nativeToken: "FTM"
        },
        {
            id: "fantom",
            type: "testnet",
            chainId: 4002,
            nativeToken: "FTM"
        },
    ]


    private pools: Array<{ id: string; address: string; pid: number|null}> = [
        {
            id: "grapemimlp",
            address: "0x01b1F4566392589E361Cc902B68525Db68135770",
            pid: 0
        },
        {
            id: "mimwinelp",
            address: "",
            pid: 1
        },
        {
            id: "grapewinelp",
            address: "",
            pid: 2
        },
        {
            id: "vineyard",
            address: "0x28c65dcB3a5f0d456624AFF91ca03E4e315beE49",
            pid: 3
        },
        {
            id: "winery",
            address: "0x3ce7bC78a7392197C569504970017B6Eb0d7A972",
            pid: 3
        }
    ];

    private nodes: Array<{ id: string, token_contract_address: string, node_contract_address: string, asset: string, ABI: any, TOKEN_ABI: any; }> = [
        {
            id: "grape",
            token_contract_address: "0x5541D83EFaD1f281571B343977648B75d95cdAC2",
            node_contract_address: "0x4cde1deb1fd11fec61b6e2d322c1520527992196",
            asset: "GF_GRAPE_NODE",
            ABI: NODE_GRAPE_ABI,
            TOKEN_ABI: GRAPE_ABI
        },
        {
            id: "wine",
            token_contract_address: "0xC55036B5348CfB45a932481744645985010d3A44",
            node_contract_address: "0x5bbee99cdfe4494230012f985bf29da246246e0d",
            asset: "GF_WINE_NODE",
            // node_contract_address: "0x4cde1deb1fd11fec61b6e2d322c1520527992196",
            ABI: NODE_WINE_ABI,
            TOKEN_ABI: WINE_ABI
        }
    ];

    private protocols: { [key: string]: { id: string, blockchain: string, ABI: any, address: string; yieldAssets: Array<string>, rewardAssets: Array<string>, depositAssets: Array<string>, tasks: { stake: string, claim: string, poolclaim: string, buynode: string, swapnative: string, swaptokens: string, addliquidity: string, removeLiquidity: string, withdraw: string; }; }; } = {
        "grapefinance-vineyard": {
            id: "grapefinance-vineyard",
            blockchain: "avalanche",
            ABI: GRAPEFINANCEVINEYARD_ABI,
            address: "0x28c65dcB3a5f0d456624AFF91ca03E4e315beE49",
            yieldAssets: ['WINE'],
            rewardAssets: [],
            depositAssets: ['GRAPE', 'GRAPE-MIM-LP', 'WINE-MIM-LP', 'GRAPE-WINE-LP', 'WAMP'],
            tasks: {
                stake: "deposit",
                claim: "",
                poolclaim: "withdraw",
                buynode: "",
                swapnative: "",
                swaptokens: "",
                addliquidity: "",
                removeLiquidity: "",
                withdraw: ""
            }
        },
        "grapefinance-winery": {
            id: "grapefinance-winery",
            blockchain: "avalanche",
            ABI: GRAPEFINANCEWINERY_ABI,
            address: "0x3ce7bC78a7392197C569504970017B6Eb0d7A972",
            yieldAssets: ['GRAPE'],
            rewardAssets: [],
            depositAssets: ['WINE'],
            tasks: {
                stake: "stake",
                claim: "claimReward",
                poolclaim: "",
                buynode: "",
                swapnative: "",
                swaptokens: "",
                addliquidity: "",
                removeLiquidity: "",
                withdraw: "withdraw"
            }
        },
        "grapefinance-grapenode": {
            id: "grapefinance-grapenode",
            blockchain: "avalanche",
            ABI: GRAPEFINANCENODE_ABI,
            address: "0x4cDE1deb1FD11FeC61b6e2d322c1520527992196",
            yieldAssets: ['GRAPE'],
            rewardAssets: [],
            depositAssets: ['GF-GRAPE-NODE'],
            tasks: {
                stake: "stake",
                claim: "claim",
                poolclaim: "",
                buynode: "create",
                swapnative: "",
                swaptokens: "",
                addliquidity: "",
                removeLiquidity: "",
                withdraw: "withdraw"
            }
        },
        "grapefinance-winenode": {
            id: "grapefinance-winenode",
            blockchain: "avalanche",
            ABI: GRAPEFINANCEWINENODE_ABI,
            address: "0x5bBeE99CDfe4494230012f985bf29dA246246e0D",
            yieldAssets: ['WINE'],
            rewardAssets: [],
            depositAssets: ['GF-WINE-NODE'],
            tasks: {
                stake: "stake",
                claim: "claim",
                poolclaim: "",
                buynode: "create",
                swapnative: "",
                swaptokens: "",
                addliquidity: "",
                removeLiquidity: "",
                withdraw: "withdraw"
            }
        },
        "rubymine": {
            id: "rubymine",
            blockchain: "avalanche",
            ABI: RUBYMINE_ABI,
            address: "0x31A226acD218fe1FD2E6b26767E670e868b6E65f",
            yieldAssets: ['RUBY'],
            rewardAssets: [],
            depositAssets: ['AVAX'],
            tasks: {
                stake: "harvestRubies",
                claim: "",
                poolclaim: "",
                buynode: "",
                swapnative: "",
                swaptokens: "",
                addliquidity: "",
                removeLiquidity: "",
                withdraw: ""
            }
        },
        "traderjoe": {
            id: "traderjoe",
            blockchain: "avalanche",
            ABI: TRADERJOE_ABI,
            address: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
            yieldAssets: [],
            rewardAssets: [],
            depositAssets: [],
            tasks: {
                stake: "",
                claim: "",
                poolclaim: "",
                buynode: "",
                swapnative: "swapExactAVAXForTokens",
                swaptokens: "swapExactTokensForTokens",
                addliquidity: "addLiquidity",
                removeLiquidity: "removeLiquidity",
                withdraw: ""
            }
        }
    };


    private tasks: Array<{ id: string; }> = [
        {
            id: "stake"
        },
        {
            id: "unstake"
        }
    ];

    public findChainByChainId(chainId: number | undefined) {
        let result = null;
        for (const chain of this.chains) {
            if (chain.chainId == chainId) {
                result = chain;
            }
        }
        if (!result) {
            throw new Error("chainId does not match any register");
        }
        return result;
    }

    public findPayrollAccount(accountName: string) {
        let result = null;
        for (const account of this.payrollAccounts) {
            if (account.id == accountName) {
                result = account;
            }
        }
        if (!result) {
            throw new Error("accountName arg does not match any register");
        }
        return result;
    }

    public findToken(tokenName: string) {
        let result = null;
        for (const token of this.tokens) {
            if (token.id == tokenName) {
                result = token;
            }
        }
        if (!result) {
            throw new Error("token arg does not match any register");
        }
        return result;
    }

    public findTokenByAddress(tokenAddress: string) {
        let result = null;
        for (const token of this.tokens) {
            if (token.address == tokenAddress) {
                result = token;
            }
        }
        if (!result) {
            throw new Error("token address arg does not match any register");
        }
        return result;
    }

    public findPool(poolName: string) {
        let result = null;
        for (const pool of this.pools) {
            if (pool.id == poolName) {
                result = pool;
            }
        }
        if (!result) {
            throw new Error("pool arg does not match any register");
        }
        return result;
    }

    public findNode(nodeName: string) {
        let result = null;
        for (const node of this.nodes) {
            if (node.id == nodeName) {
                result = node;
            }
        }
        if (!result) {
            throw new Error("node arg does not match any register");
        }
        return result;
    }

    public findProtocol(protocolName: string) {
        let result = null;
        for (const [k, v] of Object.entries(this.protocols)) {
            if (v.id == protocolName) {
                result = v;
            }
        }
        if (!result) {
            throw new Error("protocol arg does not match any register");
        }
        return result;
    }

    public getPayrollValue() {
        let payrollValue = 0.0;
        for (const account of this.payrollAccounts) {
            payrollValue = payrollValue + parseFloat(account.amount);
        }

        return payrollValue;
    }

    public getEntityData(protocolName: string) {

        return { ABI: this.protocols[protocolName].ABI, address: this.protocols[protocolName].address,  name: 'entityName' };
    }
}