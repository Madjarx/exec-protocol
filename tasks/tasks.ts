import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { SignerWithAddress } from "hardhat-deploy-ethers/src/signers";
import { BigNumber } from "ethers";
import { ContractTransaction } from "@ethersproject/contracts";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import ERC20_ABI from "../ABI/ERC20.json";
import TRADERJOE_ABI from "../ABI/TraderJoe.json";
import { TaskRegistry } from "../src/classes/Registry";
import { SwapNativeTask } from "../src/tasks/SwapNativeTask";
import { SwapTokensTask } from "../src/tasks/SwapTokensTask";
import { AddLiquidityTask } from "../src/tasks/AddLiquidityTask";
import { RemoveLiquidityTask } from "../src/tasks/RemoveLiquidityTask";
import { ClaimTask } from "../src/tasks/ClaimTask";
import { WithdrawTask } from "../src/tasks/WithdrawTask";
import { PoolClaimTask } from "../src/tasks/PoolClaimTask";
import { BuyNodeTask } from "../src/tasks/BuyNodeTask";
import { DepositTask } from "../src/tasks/DepositTask";
import { StakeTask } from "../src/tasks/StakeTask";
import { EnvUtil } from "../src/classes/EnvUtil";
import Money from "../lib/money/Money";
import { OldMoney } from "../src/classes/OldMoney";
import { string } from "hardhat/internal/core/params/argumentTypes";
import Ledger from "../accounting/Ledger";
import Tracker from "../accounting/Tracker";
const path = require("path");
const envFilePath = path.resolve(__dirname, "../.env");

dotenv.config();



//region CONSTANTS
const FLOW_04_TASK_01_MIN_AMOUNT_OF_MIM_TO_START: string = process.env.FLOW_04_TASK_01_MIN_AMOUNT_OF_MIM_TO_START as string;
const FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_REWARDS_TO_START: string = process.env.FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_REWARDS_TO_START as string;
const FLOW_04_TASK_01_DO_WE_CLAIM_ALL: string = process.env.FLOW_04_TASK_01_DO_WE_CLAIM_ALL as string;
const FLOW_04_TASK_01_AMOUNT_OF_WINE_TO_CLAIM: string = process.env.FLOW_04_TASK_01_AMOUNT_OF_WINE_TO_CLAIM as string;
const FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_GRAPE_LP: string = process.env.FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_GRAPE_LP as string;
const FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_MIM_LP: string = process.env.FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_MIM_LP as string;
const FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_IN_WALLET: string = process.env.FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_IN_WALLET as string;

const FLOW_05_MIN_GRAPE_CLAIMABLE: string = process.env.FLOW_05_MIN_GRAPE_CLAIMABLE as string;
const FLOW_05_MIN_WINE_CLAIMABLE: string = process.env.FLOW_05_MIN_WINE_CLAIMABLE as string;

const FLOW_05_RUN_ID: string = process.env.FLOW_05_RUN_ID as string;

//endregion

let ethers: any = null;

function setEnvironment(hre: any) {
    ethers = hre.ethers;
}

async function getAccount() {

    let account1: SignerWithAddress;
    const accounts = await ethers.getSigners();

    // @ts-ignore
    if (accounts.length > 0) {
        account1 = accounts[0];
    } else {
        throw new Error("no accounts found by ethers.getSigners()");
    }

    return account1;

}

/*
like "Run_ID, Date, Action, Step, Account, Asset, Amount, Tx" 
Date = now()
Run = 1
Action = winenode.nodes_wine.claim
Step = claim
Account = grapefinance:nodes:winenode
Asset = WINE
Amount = 0.1
Tx = 0x00000....
*/
interface execOptionsRef {
    log: boolean | undefined,
    ledger: boolean | undefined,
    logInfo: {
        label: string | undefined,
        protocol: string | undefined,
        chainId: string | undefined,
        nativeToken: string | undefined,
        run: number | undefined,
        action: string | undefined,
        step: string | undefined,
        amount: number | undefined,
        asset: string | undefined,
        tx: string | undefined
    }
}
export async function execTx(tx: Promise<ContractTransaction> | ContractTransaction, options: execOptionsRef, balanceBefore: Balances) {
    // const before = await getBalances();
    const result = await (await tx).wait();
    const before = balanceBefore;
    const after = await getBalances();
    const delta = await getDelta(before, after);

    const resultString = JSON.stringify(result);
    const beforeString = JSON.stringify(before);
    const afterString = JSON.stringify(after);
    const deltaString = JSON.stringify(delta);


    options.log && console.log(`execTx`, {
        beforeString,
        resultString,
        afterString,
        deltaString
    });

    if (options.ledger) {
        const ledger = new Ledger({ filename: 'ledger' });
        await ledger.addTransaction(delta, options.logInfo.label);

        const tracker = new Tracker({ filename: 'tracker' });
        await tracker.addTransaction(delta, options.logInfo.label);
    }

    return { receipt: result, delta: delta };
}

// context == application state / wallet state / connection to chain

const registry = new TaskRegistry();

async function claimExecutor(task: ClaimTask, safeArgs: { protocol: string }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);


    return await task.execute({ protocol: safeArgs.protocol });
}

async function withdrawExecutor(task: WithdrawTask, safeArgs: { protocol: string, amount: BigNumber; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);


    return await task.execute({ protocol: safeArgs.protocol, amount: safeArgs.amount });
}

async function swapNativeExecutor(task: SwapNativeTask, safeArgs: { protocol: string, tokenInAddress: string, tokenOutAddress: string, amount: BigNumber; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({
        protocol: safeArgs.protocol,
        tokenInAddress: safeArgs.tokenInAddress,
        tokenOutAddress: safeArgs.tokenOutAddress,
        amount: safeArgs.amount
    });
}

async function swapTokensExecutor(task: SwapTokensTask, safeArgs: { protocol: string, tokenInAddress: string, tokenOutAddress: string, amount: BigNumber; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({
        protocol: safeArgs.protocol,
        tokenInAddress: safeArgs.tokenInAddress,
        tokenOutAddress: safeArgs.tokenOutAddress,
        amount: safeArgs.amount
    });
}

async function addLiquidityExecutor(task: AddLiquidityTask, safeArgs: { protocol: string, token1Address: string, token2Address: string, amount1: BigNumber, amount2: BigNumber; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({
        protocol: safeArgs.protocol,
        token1Address: safeArgs.token1Address,
        token2Address: safeArgs.token2Address,
        amount1: safeArgs.amount1,
        amount2: safeArgs.amount2
    });
}

async function poolclaimExecutor(
    task: PoolClaimTask,
    safeArgs: {
        protocol: string, pool: string, amount: BigNumber;
    }) {

    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({
        protocol: safeArgs.protocol,
        pool: safeArgs.pool,
        amount: safeArgs.amount
    });
}

async function removeLiquidityExecutor(task: RemoveLiquidityTask, safeArgs: { protocol: string, token1Address: string, token2Address: string, liquidityPair: string, amount: BigNumber; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({
        protocol: safeArgs.protocol,
        token1Address: safeArgs.token1Address,
        token2Address: safeArgs.token2Address,
        liquidityPair: safeArgs.liquidityPair,
        amount: safeArgs.amount
    });
}

async function stakeExecutor(task: StakeTask, safeArgs: { protocol: string, token: string, amount: BigNumber; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({ protocol: safeArgs.protocol, token: safeArgs.token, amount: safeArgs.amount });
}

async function depositExecutor(task: DepositTask, safeArgs: { protocol: string, amount: BigNumber; liquidityPair: string; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({
        protocol: safeArgs.protocol,
        amount: safeArgs.amount,
        liquidityPair: safeArgs.liquidityPair
    });

    // await tx.wait();
}

async function buyNodeExecutor(task: BuyNodeTask, safeArgs: { protocol: string, node: string, amount: BigNumber; }) {
    console.log(`executing task ${task.getName()}...`);
    console.log(safeArgs);

    return await task.execute({ protocol: safeArgs.protocol, node: safeArgs.node, amount: safeArgs.amount });
}


async function checkFunds(address: string) {

    const accounts = await ethers.provider.listAccounts();
    console.log("accounts: ");
    console.log(accounts);
    console.log("checking available funds...");
    console.log("wallet address:", address);
    const balance = await ethers.provider.getBalance(address);
    const balanceFmt = ethers.utils.formatEther(balance);
    console.log("balance:", balanceFmt);
}



export interface Balances {
    wallet: {
        [key: string]: { amount: number, value: string, price: number },
    },
    buckets: {
        [key: string]: { amount: number, value: string, price: number },
    }
}

export async function getBalances(): Promise<Balances> {
    const account: SignerWithAddress = await getAccount();

    const grapeTokenAddress = registry.findToken("grape").address;
    const wineTokenAddress = registry.findToken("wine").address;
    const mimTokenAddress = registry.findToken("mim").address;
    const grapeWineLPTokenAddress = registry.findToken("grape-wine-lp").address;
    const mimWineLPTokenAddress = registry.findToken("mim-wine-lp").address;
    const grapeMIMLPTokenAddress = registry.findToken("grape-mim-lp").address;
    const wavaxTokenAddress = registry.findToken("wavax").address;
    const usdcTokenAddress = registry.findToken("usdc").address;
    const traderJoeContractAddress = registry.findProtocol("traderjoe").address;
    const grapeNodeContractAddress = registry.findNode("grape").node_contract_address;
    const wineNodeContractAddress = registry.findNode("wine").node_contract_address;

    const grapeNodeContractABI = registry.findNode("grape").ABI;
    const wineNodeContractABI = registry.findNode("wine").ABI;

    const grapeTokenContract = await ethers.getContractAt(ERC20_ABI, grapeTokenAddress);
    const wineTokenContract = await ethers.getContractAt(ERC20_ABI, wineTokenAddress);
    const mimTokenContract = await ethers.getContractAt(ERC20_ABI, mimTokenAddress);
    const grapeMIMLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeMIMLPTokenAddress);
    const grapeWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeWineLPTokenAddress);
    const mimWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, mimWineLPTokenAddress);
    const traderJoeContract = await ethers.getContractAt(TRADERJOE_ABI, traderJoeContractAddress);
    const grapeNodeContract = await ethers.getContractAt(grapeNodeContractABI, grapeNodeContractAddress);
    const wineNodeContractABI2 = [{ "inputs": [{ "internalType": "uint256", "name": "_startTime", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "account", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "num", "type": "uint256" }], "name": "CreateNode", "type": "event" }, { "inputs": [], "name": "MULTIPLIER", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "TOKEN", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "allocPoints", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address payable", "name": "newDev", "type": "address" }], "name": "changeDev", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "claim", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "claimTreasuryRewards", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "compound", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "nodeTier", "type": "uint256" }, { "internalType": "uint256", "name": "numNodes", "type": "uint256" }], "name": "create", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "dripRate", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "dripRewards", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "contract IERC20", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amnt", "type": "uint256" }], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "enabled", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getBalancePool", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getDayDripEstimate", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "getDistributionRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_sender", "type": "address" }], "name": "getNodes", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getRewardDrip", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getTotalNodes", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_sender", "type": "address" }], "name": "getTotalRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_sender", "type": "address" }], "name": "isMaxPayout", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "lastDripTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_sender", "type": "address" }], "name": "maxPayout", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxReturnPercent", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }], "name": "nodes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_sender", "type": "address" }, { "internalType": "uint256", "name": "_nodeId", "type": "uint256" }], "name": "numNodes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "rate", "type": "uint256" }], "name": "setDripRate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bool", "name": "_enabled", "type": "bool" }], "name": "setEnabled", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "name": "setLastDripTime", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "percent", "type": "uint256" }], "name": "setMaxReturnPercent", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }, { "internalType": "uint256[]", "name": "_nodes", "type": "uint256[]" }], "name": "setNodes", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_startTime", "type": "uint256" }], "name": "setStartTime", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256[]", "name": "_tierAllocPoints", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "_tierAmounts", "type": "uint256[]" }], "name": "setTierValues", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "percent", "type": "uint256" }], "name": "setTreasuryFeePercent", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_addr", "type": "address" }, { "components": [{ "internalType": "uint256", "name": "total_deposits", "type": "uint256" }, { "internalType": "uint256", "name": "total_claims", "type": "uint256" }, { "internalType": "uint256", "name": "last_distPoints", "type": "uint256" }], "internalType": "struct Node.User", "name": "_user", "type": "tuple" }], "name": "setUser", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "startTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "tierAllocPoints", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "tierAmounts", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalAllocPoints", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalDistributePoints", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalDistributeRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "totalNodes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "total_claimed", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "total_deposited", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "total_rewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "total_users", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "treasuryFeePercent", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "treasury_rewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "userIndices", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "users", "outputs": [{ "internalType": "uint256", "name": "total_deposits", "type": "uint256" }, { "internalType": "uint256", "name": "total_claims", "type": "uint256" }, { "internalType": "uint256", "name": "last_distPoints", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "stateMutability": "payable", "type": "receive" }];
    const wineNodeContract = await ethers.getContractAt(wineNodeContractABI2, wineNodeContractAddress);

    // console.log('wineNodeContract:');
    // console.log(wineNodeContract);
    let wineNodesBalance = await wineNodeContract.getNodes(account.address);
    // console.log('wineNodesBalance:', wineNodesBalance);
    wineNodesBalance = parseFloat(ethers.utils.formatUnits(wineNodesBalance[0], 0));
    // console.log('wineNodesBalance:', wineNodesBalance);

    let wineNodesWineClaimable:BigNumber|number = BigNumber.from('0') //await wineNodeContract.getTotalRewards(account.address);
    // console.log("wineNodesWineClaimable:",wineNodesWineClaimable);
    wineNodesWineClaimable = OldMoney.parseAmount(wineNodesWineClaimable);
    // console.log("wineNodesWineClaimable:",wineNodesWineClaimable);

    let grapeNodesBalance = await grapeNodeContract.getNodes(account.address);
    grapeNodesBalance = parseFloat(ethers.utils.formatUnits(grapeNodesBalance[0], 0));

    let grapeNodesGrapeClaimable = await grapeNodeContract.getTotalRewards(account.address);
    // console.log("grapeNodesGrapeClaimable:",grapeNodesGrapeClaimable);
    grapeNodesGrapeClaimable = OldMoney.parseAmount(grapeNodesGrapeClaimable);
    // console.log("grapeNodesGrapeClaimable:",wineNodesGrapeClaimable);



    let wineRewardPoolAddress = "0x28c65dcB3a5f0d456624AFF91ca03E4e315beE49";
    // let abiX = [{ "inputs": [{ "internalType": "address", "name": "_wine", "type": "address" }, { "internalType": "uint256", "name": "_poolStartTime", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "EmergencyWithdraw", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "RewardPaid", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Withdraw", "type": "event" }, { "inputs": [], "name": "TOTAL_REWARDS", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_allocPoint", "type": "uint256" }, { "internalType": "contract IERC20", "name": "_token", "type": "address" }, { "internalType": "bool", "name": "_withUpdate", "type": "bool" }, { "internalType": "uint256", "name": "_lastRewardTime", "type": "uint256" }], "name": "add", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_fromTime", "type": "uint256" }, { "internalType": "uint256", "name": "_toTime", "type": "uint256" }], "name": "getGeneratedReward", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "contract IERC20", "name": "_token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }], "name": "governanceRecoverUnsupported", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "massUpdatePools", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "operator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "address", "name": "_user", "type": "address" }], "name": "pendingShare", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "poolEndTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "poolInfo", "outputs": [{ "internalType": "contract IERC20", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "allocPoint", "type": "uint256" }, { "internalType": "uint256", "name": "lastRewardTime", "type": "uint256" }, { "internalType": "uint256", "name": "accWinePerShare", "type": "uint256" }, { "internalType": "bool", "name": "isStarted", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "poolStartTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "runningTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_allocPoint", "type": "uint256" }], "name": "set", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_operator", "type": "address" }], "name": "setOperator", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "totalAllocPoint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }], "name": "updatePool", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "userInfo", "outputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "rewardDebt", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "wine", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "winePerSecond", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]
    let wineRewardPoolABI = [{ "inputs": [{ "internalType": "address", "name": "_wine", "type": "address" }, { "internalType": "uint256", "name": "_poolStartTime", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "EmergencyWithdraw", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "RewardPaid", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "pid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Withdraw", "type": "event" }, { "inputs": [], "name": "TOTAL_REWARDS", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_allocPoint", "type": "uint256" }, { "internalType": "contract IERC20", "name": "_token", "type": "address" }, { "internalType": "bool", "name": "_withUpdate", "type": "bool" }, { "internalType": "uint256", "name": "_lastRewardTime", "type": "uint256" }], "name": "add", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_fromTime", "type": "uint256" }, { "internalType": "uint256", "name": "_toTime", "type": "uint256" }], "name": "getGeneratedReward", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "contract IERC20", "name": "_token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }], "name": "governanceRecoverUnsupported", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "massUpdatePools", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "operator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "address", "name": "_user", "type": "address" }], "name": "pendingShare", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "poolEndTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "poolInfo", "outputs": [{ "internalType": "contract IERC20", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "allocPoint", "type": "uint256" }, { "internalType": "uint256", "name": "lastRewardTime", "type": "uint256" }, { "internalType": "uint256", "name": "accWinePerShare", "type": "uint256" }, { "internalType": "bool", "name": "isStarted", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "poolStartTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "runningTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_allocPoint", "type": "uint256" }], "name": "set", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_operator", "type": "address" }], "name": "setOperator", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "totalAllocPoint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }], "name": "updatePool", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "userInfo", "outputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "rewardDebt", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "wine", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "winePerSecond", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_pid", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]
    let wineRewardPoolContract = await ethers.getContractAt(wineRewardPoolABI, wineRewardPoolAddress);


    let vineyardGrapeMimLpWineClaimable = await wineRewardPoolContract.pendingShare(0, account.address);
    vineyardGrapeMimLpWineClaimable = OldMoney.parseAmount(vineyardGrapeMimLpWineClaimable);
    // console.log("vineyardGrapeMimLpWineClaimable:",vineyardGrapeMimLpWineClaimable);
    let vineyardWineMimLpWineClaimable = await wineRewardPoolContract.pendingShare(1, account.address);
    vineyardWineMimLpWineClaimable = OldMoney.parseAmount(vineyardWineMimLpWineClaimable);
    // console.log("vineyardWineMimLpWineClaimable:",vineyardWineMimLpWineClaimable);
    let vineyardGrapeWineLpWineClaimable = await wineRewardPoolContract.pendingShare(2, account.address);
    vineyardGrapeWineLpWineClaimable = OldMoney.parseAmount(vineyardGrapeWineLpWineClaimable);
    // console.log("vineyardGrapeWineLpWineClaimable:",vineyardGrapeWineLpWineClaimable);

    // console.log("wineRewardPoolContract:")
    //console.log(wineRewardPoolContract)

    // let vineyardStakedGrapeWineClaimable = await wineRewardPoolContract.pendingShare(3, account.address);
    // console.log("vineyardStakedGrapeWineClaimable:",vineyardStakedGrapeWineClaimable);
    // vineyardStakedGrapeWineClaimable = OldMoney.parseAmount(vineyardStakedGrapeWineClaimable);
    let vineyardStakedGrapeUserInfo = await wineRewardPoolContract.userInfo(3, account.address);

    let vineyardStakedGrape = OldMoney.parseAmount(vineyardStakedGrapeUserInfo[0]);
    // let vineyardStakedGrapeWineClaimable = OldMoney.parseAmount(vineyardStakedGrapeUserInfo[1]);



    let vineyardStakedGrapeWineClaimable = await wineRewardPoolContract.pendingShare(3, account.address);
    vineyardStakedGrapeWineClaimable = OldMoney.parseAmount(vineyardStakedGrapeWineClaimable);



    // console.log("vineyardStakedGrape:", vineyardStakedGrape);
    // console.log("vineyardStakedGrapeWineClaimable:", vineyardStakedGrapeWineClaimable);

    //0--> grape-mim-lp ?
    //1--> wine-mim-lp staked
    //2--> grape-wine-lp staked
    //3--> ?
    //let userInfo =  await contractX.userInfo(1, account.address);
    let userInfoGrapeMim = await wineRewardPoolContract.userInfo(0, account.address);
    let grapeMimLPStaked = OldMoney.parseAmount(userInfoGrapeMim["amount"]);

    let userInfoMimWine = await wineRewardPoolContract.userInfo(1, account.address);
    let mimWineLPStaked = OldMoney.parseAmount(userInfoMimWine["amount"]);

    let userInfoGrapeWine = await wineRewardPoolContract.userInfo(2, account.address);
    let grapeWineLPStaked = OldMoney.parseAmount(userInfoGrapeWine["amount"]);


    let boardroomAddress = "0x3ce7bC78a7392197C569504970017B6Eb0d7A972";
    let boardroomABI = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "executor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "at", "type": "uint256" }], "name": "Initialized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "RewardAdded", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }], "name": "RewardPaid", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Staked", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Withdrawn", "type": "event" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "allocateSeigniorage", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "boardroomHistory", "outputs": [{ "internalType": "uint256", "name": "time", "type": "uint256" }, { "internalType": "uint256", "name": "rewardReceived", "type": "uint256" }, { "internalType": "uint256", "name": "rewardPerShare", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "member", "type": "address" }], "name": "canClaimReward", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "member", "type": "address" }], "name": "canWithdraw", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "claimReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "member", "type": "address" }], "name": "earned", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "epoch", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "exit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getGrapePrice", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "member", "type": "address" }], "name": "getLastSnapshotIndexOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "contract IERC20", "name": "_token", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "address", "name": "_to", "type": "address" }], "name": "governanceRecoverUnsupported", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "grape", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "contract IERC20", "name": "_grape", "type": "address" }, { "internalType": "contract IERC20", "name": "_share", "type": "address" }, { "internalType": "contract ITreasury", "name": "_treasury", "type": "address" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "initialized", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestSnapshotIndex", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "members", "outputs": [{ "internalType": "uint256", "name": "lastSnapshotIndex", "type": "uint256" }, { "internalType": "uint256", "name": "rewardEarned", "type": "uint256" }, { "internalType": "uint256", "name": "epochTimerStart", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "nextEpochPoint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "operator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "rewardLockupEpochs", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "rewardPerShare", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_withdrawLockupEpochs", "type": "uint256" }, { "internalType": "uint256", "name": "_rewardLockupEpochs", "type": "uint256" }], "name": "setLockUp", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_operator", "type": "address" }], "name": "setOperator", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "share", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "treasury", "outputs": [{ "internalType": "contract ITreasury", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "withdrawLockupEpochs", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }]
    let boardroomContract = await ethers.getContractAt(boardroomABI, boardroomAddress);

    let wineryGrapeClaimable = await boardroomContract.earned(account.address);
    wineryGrapeClaimable = OldMoney.parseAmount(wineryGrapeClaimable);

    let wineryWineStaked = await boardroomContract.balanceOf(account.address);
    wineryWineStaked = OldMoney.parseAmount(wineryWineStaked);

    let avaxTokenBalance = await ethers.provider.getBalance(account.address);
    avaxTokenBalance = OldMoney.parseAmount(avaxTokenBalance);

    let avaxPriceInUsdc = await traderJoeContract.getAmountsOut(OldMoney.toSafeMoneyWithLimit(1), [wavaxTokenAddress, usdcTokenAddress]);
    // console.log("avaxPriceInUsdc:", avaxPriceInUsdc);
    avaxPriceInUsdc = Math.round(ethers.utils.formatUnits(avaxPriceInUsdc[1], 6) * 100) / 100;
    // console.log("avaxPriceInUsdc:", avaxPriceInUsdc);
    const avaxValueInUsdc = Math.round(avaxPriceInUsdc * avaxTokenBalance * 100) / 100;


    let mimTokenBalance = await mimTokenContract.balanceOf(account.address);
    mimTokenBalance = OldMoney.parseAmount(mimTokenBalance);

    let mimPriceInUsdc = await traderJoeContract.getAmountsOut(OldMoney.toSafeMoneyWithLimit(1), [mimTokenAddress, usdcTokenAddress]);
    mimPriceInUsdc = ethers.utils.formatUnits(mimPriceInUsdc[1], 6);
    const mimValueInUsdc = Math.round(mimPriceInUsdc * mimTokenBalance * 100) / 100;

    let grapeTokenBalance = await grapeTokenContract.balanceOf(account.address);
    grapeTokenBalance = OldMoney.parseAmount(grapeTokenBalance);

    let grapePriceInMim = await traderJoeContract.getAmountsOut(OldMoney.toSafeMoneyWithLimit(1), [grapeTokenAddress, mimTokenAddress]);
    grapePriceInMim = ethers.utils.formatUnits(grapePriceInMim[1], 18);
    // console.log('grapePriceInMim:', grapePriceInMim);

    const grapePriceInUsdc = grapePriceInMim * mimPriceInUsdc;
    const grapeValueInUsdc = Math.round(grapePriceInUsdc * grapeTokenBalance * 100) / 100;
    // console.log('grapeValueInUsdc:', grapeValueInUsdc);
    const wineryGrapeClaimableValueInUsdc = Math.round(grapePriceInMim * wineryGrapeClaimable * mimPriceInUsdc * 100) / 100;

    const vineyardStakedGrapeUsdcValue = Math.round(vineyardStakedGrape * grapePriceInUsdc * 100) / 100;

    const grapeNodeCostInGrape = 50.0;
    const grapeNodesPriceInUsdc = grapeNodeCostInGrape * grapePriceInUsdc;
    const grapeNodesValueInUsdc = Math.round(grapeNodesPriceInUsdc * grapeNodesBalance * 100) / 100;
    const grapeNodesGrapeClaimableValueInUsdc = Math.round(grapePriceInMim * (grapeNodesGrapeClaimable) * mimPriceInUsdc * 100) / 100;

    let wineTokenBalance = await wineTokenContract.balanceOf(account.address);
    wineTokenBalance = OldMoney.parseAmount(wineTokenBalance);

    let winePriceInMim = await traderJoeContract.getAmountsOut(OldMoney.toSafeMoneyWithLimit(1), [wineTokenAddress, mimTokenAddress]);
    winePriceInMim = ethers.utils.formatUnits(winePriceInMim[1], 18);
    // console.log('winePriceInMim:', winePriceInMim);

    const winePriceInUsdc = winePriceInMim * mimPriceInUsdc;
    const wineValueInUsdc = Math.round(wineTokenBalance * winePriceInUsdc * 100) / 100;
    // console.log('wineValueInUsdc:', wineValueInUsdc);

    const wineryStakedWineValueInUsdc = Math.round(winePriceInMim * wineryWineStaked * mimPriceInUsdc * 100) / 100;
    const vineyardWineMimLpWineClaimableValueInUsdc = Math.round(winePriceInMim * vineyardWineMimLpWineClaimable * mimPriceInUsdc * 100) / 100;
    const vineyardGrapeWineLpWineClaimableValueInUsdc = Math.round(winePriceInMim * vineyardGrapeWineLpWineClaimable * mimPriceInUsdc * 100) / 100;
    const vineyardGrapeMimLpWineClaimableValueInUsdc = Math.round(winePriceInMim * vineyardGrapeMimLpWineClaimable * mimPriceInUsdc * 100) / 100;

    let vineyardStakedGrapeWineClaimableValueInUsdc = Math.round(vineyardStakedGrapeWineClaimable * winePriceInUsdc * 100) / 100;

    const wineNodeCostInWine = 0.5;
    const wineNodesPriceInUsdc = wineNodeCostInWine * winePriceInUsdc;
    const wineNodesValueInUsdc = Math.round(wineNodesPriceInUsdc * wineNodesBalance * 100) / 100;
    const wineNodesWineClaimableValueInUsdc = Math.round(winePriceInMim * (wineNodesWineClaimable) * mimPriceInUsdc * 100) / 100;

    let grapeMIMLPTokenBalance = await grapeMIMLPTokenContract.balanceOf(account.address);
    grapeMIMLPTokenBalance = OldMoney.parseAmount(grapeMIMLPTokenBalance);

    let grapeWineLPTokenBalance = await grapeWineLPTokenContract.balanceOf(account.address);
    grapeWineLPTokenBalance = OldMoney.parseAmount(grapeWineLPTokenBalance);

    let mimWineLPTokenBalance = await mimWineLPTokenContract.balanceOf(account.address);
    mimWineLPTokenBalance = OldMoney.parseAmount(mimWineLPTokenBalance);


    /////////////////////////  Value of LPs at TraderJoe

    // GRAPE-MIM-LP TOKEN VALUE
    let grapeMimLpTotalSupply = await grapeMIMLPTokenContract.totalSupply();
    grapeMimLpTotalSupply = OldMoney.parseAmount(grapeMimLpTotalSupply);
    // console.log("grapeMimLpTotalSupply: ", grapeMimLpTotalSupply);

    let ownedBalanceOfGrapeMimLp = await grapeMIMLPTokenContract.balanceOf(account.address);
    ownedBalanceOfGrapeMimLp = OldMoney.parseAmount(ownedBalanceOfGrapeMimLp);
    // console.log('ownedBalanceOfGrapeMimLp:',ownedBalanceOfGrapeMimLp); 

    let grapeTokensTotalSupplyInGrapeMimLp = await grapeTokenContract.balanceOf(grapeMIMLPTokenAddress);
    grapeTokensTotalSupplyInGrapeMimLp = OldMoney.parseAmount(grapeTokensTotalSupplyInGrapeMimLp);
    // console.log("grapeTokensTotalSupplyInGrapeMimLp", grapeTokensTotalSupplyInGrapeMimLp);

    let mimTokensTotalSupplyInGrapeMimLp = await mimTokenContract.balanceOf(grapeMIMLPTokenAddress);
    mimTokensTotalSupplyInGrapeMimLp = OldMoney.parseAmount(mimTokensTotalSupplyInGrapeMimLp);
    // console.log("mimTokensTotalSupply", mimTokensTotalSupplyInGrapeMimLp );

    let totalSupplyInGrapeMimLp = grapeTokensTotalSupplyInGrapeMimLp + mimTokensTotalSupplyInGrapeMimLp;
    // console.log("totalSupply:", totalSupplyInGrapeMimLp);


    let lpRatioForGrapeMimLp = 1.0 / totalSupplyInGrapeMimLp;
    // console.log('lpRatioForGrapeMimLp:',lpRatioForGrapeMimLp);
    let amountsOut = await traderJoeContract.getAmountsOut(OldMoney.toBigNumber(1, 18), [grapeTokenAddress, mimTokenAddress]);
    // console.log('amountsOut:',amountsOut);

    let totalGrapeOutForGrapeMimLp = 1.0 / grapeMimLpTotalSupply * grapeTokensTotalSupplyInGrapeMimLp;
    let totalMimOutForGrapeMimLp = 1.0 / grapeMimLpTotalSupply * mimTokensTotalSupplyInGrapeMimLp;

    // console.log('totalGrape:',totalGrapeOut);
    // console.log('totalMim:',totalMimOut);

    let grapeInGrapeMimLpUsdcValue = Math.round(totalGrapeOutForGrapeMimLp * grapePriceInUsdc * 100) / 100;
    let mimInGrapeMimLpUsdcValue = Math.round(totalMimOutForGrapeMimLp * mimPriceInUsdc * 100) / 100;

    // console.log("grapeInGrapeMimLpUsdValue:",grapeInGrapeMimLpUsdcValue);
    // console.log("mimInGrapeMimLpUsdValue:",mimInGrapeMimLpUsdcValue);

    let grapeMimLpUsdcValue = grapeInGrapeMimLpUsdcValue + mimInGrapeMimLpUsdcValue;


    // console.log("grapeMimLpUsdValue :",grapeMimLpUsdcValue);

    let walletGrapeMimLpUsdcValue = Math.round(ownedBalanceOfGrapeMimLp * grapeMimLpUsdcValue * 100) / 100;
    let vineyardGrapeMimLpUsdcValue = Math.round(grapeMimLPStaked * grapeMimLpUsdcValue * 100) / 100;

    //// GRAPE-WINE-LP TOKEN VALUE
    let grapeWineLpTotalSupply = await grapeWineLPTokenContract.totalSupply();
    grapeWineLpTotalSupply = OldMoney.parseAmount(grapeWineLpTotalSupply);
    // console.log("grapeWineLpTotalSupply: ", grapeWineLpTotalSupply);

    let ownedBalanceOfGrapeWineLp = await grapeWineLPTokenContract.balanceOf(account.address);
    ownedBalanceOfGrapeWineLp = OldMoney.parseAmount(ownedBalanceOfGrapeWineLp);
    // console.log('ownedBalanceOfGrapeWineLp:',ownedBalanceOfGrapeWineLp); 

    let grapeTokensTotalSupplyInGrapeWineLp = await grapeTokenContract.balanceOf(grapeWineLPTokenAddress);
    grapeTokensTotalSupplyInGrapeWineLp = OldMoney.parseAmount(grapeTokensTotalSupplyInGrapeWineLp);
    // console.log("grapeTokensTotalSupplyInGrapeWineLp", grapeTokensTotalSupplyInGrapeWineLp);

    let wineTokensTotalSupplyInGrapeWineLp = await wineTokenContract.balanceOf(grapeWineLPTokenAddress);
    wineTokensTotalSupplyInGrapeWineLp = OldMoney.parseAmount(wineTokensTotalSupplyInGrapeWineLp);
    // console.log("wineTokensTotalSupply", wineTokensTotalSupplyInGrapeWineLp );

    let totalSupplyInGrapeWineLp = grapeTokensTotalSupplyInGrapeWineLp + wineTokensTotalSupplyInGrapeWineLp;
    // console.log("totalSupply:", totalSupplyInGrapeWineLp);


    let lpRatioForGrapeWineLp = 1.0 / totalSupplyInGrapeWineLp;
    // console.log('lpRatioForGrapeWineLp:',lpRatioForGrapeWineLp);
    let grapeWineAmountsOut = await traderJoeContract.getAmountsOut(OldMoney.toBigNumber(1, 18), [grapeTokenAddress, wineTokenAddress]);
    // console.log('grapeWineAmountsOut:',grapeWineAmountsOut);

    let totalGrapeOutForGrapeWineLp = 1.0 / grapeWineLpTotalSupply * grapeTokensTotalSupplyInGrapeWineLp;
    let totalMimOutForGrapeWineLp = 1.0 / grapeWineLpTotalSupply * wineTokensTotalSupplyInGrapeWineLp;

    // console.log('totalGrape:',totalGrapeOut);
    // console.log('totalMim:',totalMimOut);

    let grapeInGrapeWineLpUsdcValue = Math.round(totalGrapeOutForGrapeWineLp * grapePriceInUsdc * 100) / 100;
    let wineInGrapeWineLpUsdcValue = Math.round(totalMimOutForGrapeWineLp * winePriceInUsdc * 100) / 100;

    // console.log("grapeInGrapeWineLpUsdValue:",grapeInGrapeWineLpUsdcValue);
    // console.log("wineInGrapeWineLpUsdValue:",wineInGrapeWineLpUsdcValue);

    let grapeWineLpUsdcValue = grapeInGrapeWineLpUsdcValue + wineInGrapeWineLpUsdcValue;


    // console.log("grapeWineLpUsdValue :",grapeWineLpUsdcValue);

    let walletGrapeWineLpUsdcValue = Math.round(ownedBalanceOfGrapeWineLp * grapeWineLpUsdcValue * 100) / 100;
    let vineyardGrapeWineLpUsdcValue = Math.round(grapeWineLPStaked * grapeWineLpUsdcValue * 100) / 100;

    //// MIM-WINE-LP TOKEN VALUE
    let mimWineLpTotalSupply = await mimWineLPTokenContract.totalSupply();
    mimWineLpTotalSupply = OldMoney.parseAmount(mimWineLpTotalSupply);
    // console.log("mimWineLpTotalSupply: ", mimWineLpTotalSupply);

    let ownedBalanceOfMimWineLp = await mimWineLPTokenContract.balanceOf(account.address);
    ownedBalanceOfMimWineLp = OldMoney.parseAmount(ownedBalanceOfMimWineLp);
    // console.log('ownedBalanceOfMimWineLp:',ownedBalanceOfMimWineLp); 

    let mimTokensTotalSupplyInMimWineLp = await mimTokenContract.balanceOf(mimWineLPTokenAddress);
    mimTokensTotalSupplyInMimWineLp = OldMoney.parseAmount(mimTokensTotalSupplyInMimWineLp);
    // console.log("mimTokensTotalSupplyInMimWineLp", mimTokensTotalSupplyInMimWineLp);

    let wineTokensTotalSupplyInMimWineLp = await wineTokenContract.balanceOf(mimWineLPTokenAddress);
    wineTokensTotalSupplyInMimWineLp = OldMoney.parseAmount(wineTokensTotalSupplyInMimWineLp);
    // console.log("wineTokensTotalSupply", wineTokensTotalSupplyInMimWineLp );

    let totalSupplyInMimWineLp = mimTokensTotalSupplyInMimWineLp + wineTokensTotalSupplyInMimWineLp;
    // console.log("totalSupply:", totalSupplyInMimWineLp);


    let lpRatioForMimWineLp = 1.0 / totalSupplyInMimWineLp;
    // console.log('lpRatioForMimWineLp:',lpRatioForMimWineLp);
    let mimWineAmountsOut = await traderJoeContract.getAmountsOut(OldMoney.toBigNumber(1, 18), [mimTokenAddress, wineTokenAddress]);
    // console.log('mimWineAmountsOut:',mimWineAmountsOut);

    let totalGrapeOutForMimWineLp = 1.0 / mimWineLpTotalSupply * mimTokensTotalSupplyInMimWineLp;
    let totalMimOutForMimWineLp = 1.0 / mimWineLpTotalSupply * wineTokensTotalSupplyInMimWineLp;

    // console.log('totalGrape:',totalGrapeOut);
    // console.log('totalMim:',totalMimOut);

    let mimInMimWineLpUsdcValue = totalGrapeOutForMimWineLp * mimPriceInUsdc;
    let wineInMimWineLpUsdcValue = totalMimOutForMimWineLp * winePriceInUsdc;

    // console.log("mimInMimWineLpUsdValue:",mimInMimWineLpUsdcValue);
    // console.log("wineInMimWineLpUsdValue:",wineInMimWineLpUsdcValue);

    let mimWineLpUsdcValue = mimInMimWineLpUsdcValue + wineInMimWineLpUsdcValue;


    // console.log("mimWineLpUsdValue :",mimWineLpUsdcValue);

    let walletMimWineLpUsdcValue = Math.round(ownedBalanceOfMimWineLp * mimWineLpUsdcValue * 100) / 100;
    let vineyardMimWineLpUsdcValue = Math.round(mimWineLPStaked * mimWineLpUsdcValue * 100) / 100;


    let portfolio = {
        wallet: {
            AVAX: {
                amount: avaxTokenBalance,
                value: avaxValueInUsdc.toString(),
                price: avaxPriceInUsdc,
                weight: 0.0
            },
            MIM: {
                amount: mimTokenBalance,
                value: mimValueInUsdc.toString(),
                price: mimPriceInUsdc,
                weight: 0.0
            },
            GRAPE: {
                amount: grapeTokenBalance,
                value: grapeValueInUsdc.toString(),
                price: grapePriceInUsdc,
                weight: 0.0
            },
            WINE: {
                amount: wineTokenBalance,
                value: wineValueInUsdc.toString(),
                price: winePriceInUsdc,
                weight: 0.0
            },
            GRAPE_MIM_LP: {
                amount: grapeMIMLPTokenBalance,
                value: walletGrapeMimLpUsdcValue.toString(),
                price: grapeMimLpUsdcValue,
                weight: 0.0
            },
            GRAPE_WINE_LP: {
                amount: grapeWineLPTokenBalance,
                value: walletGrapeWineLpUsdcValue.toString(),
                price: grapeWineLpUsdcValue,
                weight: 0.0
            },
            MIM_WINE_LP: {
                amount: mimWineLPTokenBalance,
                value: walletMimWineLpUsdcValue.toString(),
                price: mimWineLpUsdcValue,
                weight: 0.0
            },
        },
        buckets: {
            NODES_GRAPE: {
                amount: grapeNodesBalance,
                value: grapeNodesValueInUsdc.toString(),
                price: grapeNodesPriceInUsdc,
                weight: 0.0
            },
            NODES_GRAPE_CLAIMABLE: {
                amount: grapeNodesGrapeClaimable,
                value: grapeNodesGrapeClaimableValueInUsdc.toString(),
                price: grapePriceInUsdc,
                weight: 0.0
            },
            NODES_WINE: {
                amount: wineNodesBalance,
                value: wineNodesValueInUsdc.toString(),
                price: wineNodesPriceInUsdc,
                weight: 0.0
            },
            NODES_WINE_CLAIMABLE: {
                amount: wineNodesWineClaimable,
                value: wineNodesWineClaimableValueInUsdc.toString(),
                price: winePriceInUsdc,
                weight: 0.0
            },
            VINEYARD_GRAPE_MIM_LP_STAKED: {
                amount: grapeMimLPStaked,
                value: vineyardGrapeMimLpUsdcValue.toString(),
                price: grapeMimLpUsdcValue,
                weight: 0.0
            },
            VINEYARD_GRAPE_MIM_LP_WINE_CLAIMABLE: {
                amount: vineyardGrapeMimLpWineClaimable,
                value: vineyardGrapeMimLpWineClaimableValueInUsdc.toString(),
                price: winePriceInUsdc,
                weight: 0.0
            },
            VINEYARD_GRAPE_WINE_LP_STAKED: {
                amount: grapeWineLPStaked,
                value: vineyardGrapeWineLpUsdcValue.toString(),
                price: grapeWineLpUsdcValue,
                weight: 0.0
            },
            VINEYARD_GRAPE_WINE_LP_WINE_CLAIMABLE: {
                amount: vineyardGrapeWineLpWineClaimable,
                value: vineyardGrapeWineLpWineClaimableValueInUsdc.toString(),
                price: winePriceInUsdc,
                weight: 0.0
            },
            VINEYARD_MIM_WINE_LP_STAKED: {
                amount: mimWineLPStaked,
                value: vineyardMimWineLpUsdcValue.toString(),
                price: mimWineLpUsdcValue,
                weight: 0.0
            },
            VINEYARD_MIM_WINE_LP_WINE_CLAIMABLE: {
                amount: vineyardWineMimLpWineClaimable,
                value: vineyardWineMimLpWineClaimableValueInUsdc.toString(),
                price: winePriceInUsdc,
                weight: 0.0
            },
            VINEYARD_GRAPE_STAKED: {
                amount: vineyardStakedGrape,
                value: vineyardStakedGrapeUsdcValue.toString(),
                price: grapePriceInUsdc,
                weight: 0.0
            },
            VINEYARD_GRAPE_STAKED_WINE_CLAIMABLE: {
                amount: vineyardStakedGrapeWineClaimable,
                value: vineyardStakedGrapeWineClaimableValueInUsdc.toString(),
                price: winePriceInUsdc,
                weight: 0.0
            },
            WINERY_GRAPE_CLAIMABLE: {
                amount: wineryGrapeClaimable,
                value: wineryGrapeClaimableValueInUsdc.toString(),
                price: grapePriceInUsdc,
                weight: 0.0
            },
            WINERY_WINE_STAKED: {
                amount: wineryWineStaked,
                value: wineryStakedWineValueInUsdc.toString(),
                price: winePriceInUsdc,
                weight: 0.0
            }
        },
        total: {
            value: '0'
        }
    };

    let total = 0.0;


    for (var [k, v] of Object.entries(portfolio)) {
        for (var [k2, v2] of Object.entries(v)) {
            if (v2.hasOwnProperty('value')) {
                // console.log(v2)
                total = total + parseFloat(v2["value"]);
            }
        }
    }

    let totalStr = (Math.round(total * 100) / 100).toString();
    // console.log("portfolio total:", total);
    portfolio["total"]["value"] = totalStr;

    // set weights
    for (var [k, v] of Object.entries(portfolio)) {
        for (var [k2, v2] of Object.entries(v)) {
            if (v2.hasOwnProperty('weight')) {
                // console.log(v2)
                v2["weight"] = Math.round((parseFloat(v2["value"]) / total) * 10000) / 100;
            }
        }
    }




    return portfolio;
}

async function getDelta(before: Balances, after: Balances) {
    let delta: Balances = { wallet: {}, buckets: {} }
    for (const key in before['wallet']) {
        const diff = after['wallet'][key]["amount"] - before['wallet'][key]["amount"];
        if (Math.abs(diff) > 0) {
            delta['wallet'][key] = {
                amount: 0,
                value: "",
                price: 0
            }
            delta['wallet'][key]["amount"] = after['wallet'][key]["amount"] - before['wallet'][key]["amount"];
        }
    }
    for (const key in before['buckets']) {
        const diff = after['buckets'][key]["amount"] - before['buckets'][key]["amount"];
        if (Math.abs(diff) > 0) {
            delta['buckets'][key] = {
                amount: 0,
                value: "",
                price: 0
            }
            delta['buckets'][key]["amount"] = after['buckets'][key]["amount"] - before['buckets'][key]["amount"];
        }
    }
    return delta
}

async function getBucketsValueDiff(balances: Balances, comparable: number) {
    let delta: Balances = { wallet: {}, buckets: {} }

    for (const key in balances['buckets']) {
        const diff = comparable - parseFloat(balances['buckets'][key]["value"]);

        delta['buckets'][key] = {
            amount: 0,
            value: "",
            price: 0
        }
        delta["buckets"][key]["value"] = (diff.toString());

    }
    return delta
}

function getSmallestAsset(balances: Balances) {
    // console.log('getting smallest LP...');
    let smallestValue = null;
    let smallestKey = '';
    // 
    for (var [k, v] of Object.entries(balances["buckets"])) {
        if (k === 'VINEYARD_GRAPE_MIM_LP_STAKED' || k === 'VINEYARD_GRAPE_WINE_LP_STAKED' || k === 'VINEYARD_MIM_WINE_LP_STAKED' || k === 'VINEYARD_GRAPE_STAKED' || k === 'WINERY_WINE_STAKED') {
            if (!smallestValue) {
                smallestValue = parseFloat(v.value);
                smallestKey = k;
            }
            else {
                if (parseFloat(v.value) < smallestValue) {
                    smallestValue = parseFloat(v.value);
                    smallestKey = k;
                }
            }
        }
    }

    const smallestAsset = {
        k: smallestKey,
        v: smallestValue
    }

    return smallestAsset;
}

task("conversionrate", "execute task Conversion Rate")
    .addParam("protocol", "protocol to be operated with")
    .addParam("tokenin", "tokenIn")
    .addParam("tokenout", "tokenOut")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        const account: SignerWithAddress = await getAccount();
        const tokenIn: string = taskArgs["tokenIn"];
        const tokenOut: string = taskArgs["tokenOut"];
        /*
                const result = await getBalances();
                const transactionCurrencyUnit = new CurrencyUnit({ name: tokenIn, symbol: tokenIn, digits: 18 });
                const referenceCurrencyUnit = new CurrencyUnit({ name: tokenOut, symbol: tokenOut, digits: 6 });
                const cr = new ConversionRate({transactionCurrency:transactionCurrencyUnit, referenceCurrency:referenceCurrencyUnit})
                console.log(cr);
                // const tokenInAddress = registry.findToken(tokenin).address;
                // const tokenOutAddress = registry.findToken(tokenout).address;
                // cr.fetchRate(!)
                */
    });

task("journal", "execute task Journal")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);


        const ledger = new Ledger({ filename: 'ledger' });
        // await ledger.createJournalFile();

        const balances = await getBalances();
        // await ledger.setInitialBalances(balances);
        // await ledger.setPricingInfo(balances);

        // await ledger.printBalanceSheet();
        // await ledger.getPnL();

    });

task("checkfunds", "execute task Check Funds")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        const account: SignerWithAddress = await getAccount();
        // await checkFunds(account.address);
        const result = await getBalances();
        console.log(result);

    });

task("claim", "execute task Claim")
    .addParam("protocol", "protocol to be operated with")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeArgs = {
            protocol: safeProtocolId
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await claimExecutor(new ClaimTask({
            name: "claim",
            context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("withdraw", "execute task Claim")
    .addParam("protocol", "protocol to be operated with")
    .addParam("amount", "amount to withdraw")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        const ONE = 1;
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            amount: taskArgs["amount"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeArgs = {
            protocol: safeProtocolId,
            amount: safeAmount
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await withdrawExecutor(new WithdrawTask({
            name: "claim",
            context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("swapnative", "execute task Swap Native")
    .addParam("protocol", "protocol to be operated with")
    .addParam("tokenin", "token-in name")
    .addParam("tokenout", "token-out name")
    .addParam("amount", "amount of tokens to swap")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            amount: taskArgs["amount"],
            tokenin: taskArgs["tokenin"],
            tokenout: taskArgs["tokenout"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeTokenInAddress = registry.findToken(unsafeArgs.tokenin).address;
        const safeTokenOutAddress = registry.findToken(unsafeArgs.tokenout).address;
        const safeArgs = {
            protocol: safeProtocolId,
            tokenInAddress: safeTokenInAddress,
            tokenOutAddress: safeTokenOutAddress,
            amount: safeAmount
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await swapNativeExecutor(new SwapNativeTask({
            name: "swapnative",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("swaptokens", "execute task Swap Tokens")
    .addParam("protocol", "protocol to be operated with")
    .addParam("tokenin", "token-in name")
    .addParam("tokenout", "token-out name")
    .addParam("amount", "amount of tokens to swap")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            amount: taskArgs["amount"],
            tokenin: taskArgs["tokenin"],
            tokenout: taskArgs["tokenout"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeTokenInAddress = registry.findToken(unsafeArgs.tokenin).address;
        const safeTokenOutAddress = registry.findToken(unsafeArgs.tokenout).address;
        const safeArgs = {
            protocol: safeProtocolId,
            tokenInAddress: safeTokenInAddress,
            tokenOutAddress: safeTokenOutAddress,
            amount: safeAmount
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await swapTokensExecutor(new SwapTokensTask({
            name: "swaptokens",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });


task("addliquidity", "execute task Add Liquidity")
    .addParam("protocol", "protocol to be operated with")
    .addParam("token1", "token-1 name")
    .addParam("token2", "token-2 name")
    .addParam("amount1", "amount-1 of tokens to provide")
    .addParam("amount2", "amount-2 of tokens to provide")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            amount1: taskArgs["amount1"],
            amount2: taskArgs["amount2"],
            token1: taskArgs["token1"],
            token2: taskArgs["token2"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeAmount1 = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount1);
        const safeAmount2 = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount2);
        const safeToken1Address = registry.findToken(unsafeArgs.token1).address;
        const safeToken2Address = registry.findToken(unsafeArgs.token2).address;
        const safeArgs = {
            protocol: safeProtocolId,
            token1Address: safeToken1Address,
            token2Address: safeToken2Address,
            amount1: safeAmount1,
            amount2: safeAmount2
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await addLiquidityExecutor(new AddLiquidityTask({
            name: "addliquidity",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("removeliquidity", "execute task Remove Liquidity")
    .addParam("protocol", "protocol to be operated with")
    .addParam("token1", "token-1 name")
    .addParam("token2", "token-2 name")
    .addParam("liquiditypair", "name of the liquidity pair")
    .addParam("amount", "amount of liquidity to be removed")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            token1: taskArgs["token1"],
            token2: taskArgs["token2"],
            amount: taskArgs["amount"],
            liquidityPair: taskArgs["liquiditypair"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeToken1Address = registry.findToken(unsafeArgs.token1).address;
        const safeToken2Address = registry.findToken(unsafeArgs.token2).address;
        const safeLiquidityPair = registry.findToken(unsafeArgs.liquidityPair).id;
        const safeArgs = {
            protocol: safeProtocolId,
            token1Address: safeToken1Address,
            token2Address: safeToken2Address,
            liquidityPair: safeLiquidityPair,
            amount: safeAmount
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await removeLiquidityExecutor(new RemoveLiquidityTask({
            name: "removeliquidity",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("buynode", "execute task Buy Node")
    .addParam("protocol", "protocol to be operated with")
    .addParam("amount", "amount of nodes to buy")
    .addParam("node", "type of node (eg: grape, wine...)")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            node: taskArgs["node"],
            amount: taskArgs["amount"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeNodeId = registry.findNode(unsafeArgs.node).id;
        const safeArgs = {
            protocol: safeProtocolId,
            node: safeNodeId,
            amount: safeAmount
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await buyNodeExecutor(new BuyNodeTask({
            name: "buynode",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("stake", "execute task Stake")
    .addParam("protocol", "protocol to be operated with")
    .addParam("token", "token to stake")
    .addParam("amount", "amount to stake")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            token: taskArgs["token"],
            amount: taskArgs["amount"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeTokenId = registry.findToken(unsafeArgs.token).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeArgs = {
            protocol: safeProtocolId, token: safeTokenId, amount: safeAmount
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        const stake = new StakeTask({
            name: "stake",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        });
        await stakeExecutor(stake, safeArgs);
    });

task("deposit", "execute task Deposit")
    .addParam("protocol", "protocol to be operated with")
    .addParam("liquiditypair", "name of the liquidity pair")
    .addParam("amount", "amount to stake")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            amount: taskArgs["amount"],
            liquidityPair: taskArgs["liquiditypair"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeLiquidityPairId = registry.findToken(unsafeArgs.liquidityPair).id;
        const safeArgs = {
            protocol: safeProtocolId,
            amount: safeAmount,
            liquidityPair: safeLiquidityPairId
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await depositExecutor(new DepositTask({
            name: "deposit",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("poolclaim", "execute task Claim")
    .addParam("protocol", "protocol to be operated with")
    .addParam("pool", "pool to be operated with")
    .addParam("amount", "amount to stake")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            protocol: taskArgs["protocol"],
            pool: taskArgs["pool"],
            amount: taskArgs["amount"]
        };
        const safeProtocolId = registry.findProtocol(unsafeArgs.protocol).id;
        const safePool = registry.findPool(unsafeArgs.pool).id;
        const safeAmount = OldMoney.toSafeMoneyWithLimit(unsafeArgs.amount);
        const safeArgs = {
            protocol: safeProtocolId, pool: safePool, amount: safeAmount
        };
        ///////////////////////////////////////////////////////////////////
        const account: SignerWithAddress = await getAccount();
        const entity = registry.getEntityData(safeProtocolId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);
        await poolclaimExecutor(new PoolClaimTask({
            name: "poolclaim",
            context: { address: account.address, provider: hre.ethers.provider, chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
            entity: { ABI: entity.ABI, address: entity.address, name: 'entityName', hre: hre.ethers }
        }), safeArgs);
    });

task("pay", "run the pay task")
    .addParam("person", "set a person to be payed")
    .addParam("amount", "set an amount")
    .addParam("origin", "set the origin asset which will be normalized to be transferred")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        console.log("running pay flow...")

        let taskSummary: Array<string> = [];
        ///////////////////////////////////////////////////////////////////


        const safeTraderJoeId = registry.findProtocol("traderjoe").id;
        const safeVineyardId = registry.findProtocol("grapefinance-vineyard").id;
        const safeWineryId = registry.findProtocol("grapefinance-winery").id;
        const safeGrapeMIMPoolId = "grapemimlp";
        const safeMIMWinePoolId = "mimwinelp";
        const safeGrapeWinePoolId = "grapewinelp";
        const safeNodeWineId = "grapefinance-winenode";
        const safeNodeGrapeId = "grapefinance-grapenode";

        const traderJoeContractAddress = registry.findProtocol("traderjoe").address;

        const grapeTokenAddress = registry.findToken("grape").address;
        const wineTokenAddress = registry.findToken("wine").address;
        const mimTokenAddress = registry.findToken("mim").address;
        const usdcTokenAddress = registry.findToken("usdc").address
        const grapeWineLPTokenAddress = registry.findToken("grape-wine-lp").address;
        const mimWineLPTokenAddress = registry.findToken("mim-wine-lp").address;
        const grapeMIMLPTokenAddress = registry.findToken("grape-mim-lp").address;

        const traderJoeContract = await ethers.getContractAt(TRADERJOE_ABI, traderJoeContractAddress);

        const grapeTokenContract = await ethers.getContractAt(ERC20_ABI, grapeTokenAddress);
        const wineTokenContract = await ethers.getContractAt(ERC20_ABI, wineTokenAddress);
        const mimTokenContract = await ethers.getContractAt(ERC20_ABI, mimTokenAddress);
        const grapeMIMLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeMIMLPTokenAddress);
        const grapeWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeWineLPTokenAddress);
        const mimWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, mimWineLPTokenAddress);

        const account: SignerWithAddress = await getAccount();
        const accountAddress = account.address;
        let entity = registry.getEntityData(safeVineyardId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);

        //// GET INITIAL BALANCE STATE
        let balanceState = await getBalances();
        console.log('balanceState:', balanceState);

        //// GET PERSON
        let person = "";

        if (taskArgs["person"]) {
            person = registry.findPayrollAccount(taskArgs['person']).id;

           
        } else {
            throw ('person not found / not defined');
        }

        console.log('HEY!');
        console.log(registry.findPayrollAccount(person).address);

        if (registry.findPayrollAccount(person).address === "0x") {
            throw ('(!) Address not set. Check .env file');
        }


        //// GET AMOUNT
        let amount = 0.0;

        if (taskArgs["amount"]) {
            try {
                amount = parseFloat(taskArgs['amount']);
            } catch {
                throw ('amount not a number')
            }

        } else {
            throw ('amount param needed.');
        }

        //// GET ORIGIN
        let origin = "";

        if (taskArgs["origin"]) {
            origin = taskArgs['origin'];
        } else {
            throw ('origin param needed.');
        }

        console.log('person:', person);
        console.log('amount:', amount);
        console.log('origin:', origin);

        let assetsWalletValue = 0;
        let bucketsValue = 0;



        if (origin === 'GRAPE' || origin === 'WINE' || origin === 'MIM') {
            assetsWalletValue = assetsWalletValue + parseFloat(balanceState["wallet"][origin].value);
        }


        console.log('assetsWalletValue:', assetsWalletValue);

        if (origin === 'VINEYARD_GRAPE_WINE_LP_STAKED' || origin === 'VINEYARD_MIM_WINE_LP_STAKED"' || origin === 'VINEYARD_GRAPE_MIM_LP_STAKED' || origin === 'VINEYARD_GRAPE_STAKED' || origin === 'WINERY_WINE_STAKED') {
            bucketsValue = bucketsValue + parseFloat(balanceState["buckets"][origin].value);
        }

        console.log('bucketsValue:', bucketsValue);

        let amountOfGrapeToSwapIntoUsdc = 0.0;
        let amountOfWineToSwapIntoUsdc = 0.0;
        let amountOfMimToSwapIntoUsdc = 0.0;

        // 1% safety
        if (assetsWalletValue && assetsWalletValue < amount * 0.99) {
            throw ("the value of the asset is not enough to cover the payable amount (+1% safety)")
        } else if ((origin === 'GRAPE' || origin === 'WINE' || origin === 'MIM')) {
            // proceed

            const a = parseFloat(balanceState["wallet"][origin]["value"]);


            if (a > amount) {
                // pay in mim
                if (origin === 'MIM') {
                    amountOfMimToSwapIntoUsdc = amount;
                } else if (origin === 'WINE') {
                    amountOfWineToSwapIntoUsdc = amount;
                } else if (origin === 'GRAPE') {
                    amountOfGrapeToSwapIntoUsdc = amount;
                }


            }
        }

        let protocol = '';
        let pool = '';
        let token1 = '';
        let token2 = '';
        let lpPair = '';
        let asset = ''

        if (bucketsValue && bucketsValue < amount * 0.99) {
            throw ("the value of the asset is not enough to cover the payable amount (+1% safety)")
        } else {
            // proceed

            // remove from LPs
            // 1. determine which one is the smallest LP.


            const payable = amount;

            if (balanceState["buckets"][origin]) {
                const a = parseFloat(balanceState["buckets"][origin]["value"]);
                const aP = balanceState["buckets"][origin]["price"];


                const buckets = a;
                const n = 1; // amount of buckets

                const level = ((buckets) / n) - (payable / n);

                console.log('a:', a);

                console.log('buckets:', buckets);
                console.log('n:', n);
                console.log('payable:', payable);

                console.log('level:', level);


                const diff = await getBucketsValueDiff(balanceState, level);
                console.log('diff:', diff);

                const aD = parseFloat(diff["buckets"][origin]["value"]);

                // 1. BUCKET
                if (aD < 0) {

                    const amountOfLPTokensToRemove = Math.ceil((Math.abs(aD) / aP) * 100) / 100;
                    const safeAmountOfLPTokensToRemove = OldMoney.toBigNumber(amountOfLPTokensToRemove, 18);

                    console.log('amountOfGrapeWineLPTokensToRemove:', amountOfLPTokensToRemove)


                    // withdraw liquidity from ORIGIN





                    if (origin === 'VINEYARD_GRAPE_WINE_LP_STAKED') {
                        protocol = safeVineyardId;
                        pool = safeGrapeWinePoolId;
                        token1 = 'grape';
                        token2 = 'wine';
                        lpPair = 'grape-wine-lp';
                        asset = 'GRAPE_WINE_LP';

                    } else if (origin === 'VINEYARD_MIM_WINE_LP_STAKED') {
                        protocol = safeVineyardId;
                        pool = safeMIMWinePoolId;
                        token1 = 'mim';
                        token2 = 'wine';
                        lpPair = 'mim-wine-lp';
                        asset = 'MIM_WINE_LP';

                    } else if (origin === 'VINEYARD_GRAPE_MIM_LP_STAKED') {
                        protocol = safeVineyardId;
                        pool = safeGrapeMIMPoolId;
                        token1 = 'grape';
                        token2 = 'mim';
                        lpPair = 'grape-mim-lp';
                        asset = 'GRAPE_MIM_LP';

                    } else if (origin === 'VINEYARD_GRAPE_STAKED') {
                        protocol = safeVineyardId;
                        pool = 'vineyard';
                        throw ('not yet implemented');
                        token1 = 'grape';
                        token2 = '';
                        lpPair = 'grape';
                        asset = 'GRAPE';

                    } else if (origin === 'WINERY_WINE_STAKED') {
                        protocol = safeWineryId;
                        pool = 'winery';
                        throw ('not yet implemented');
                        token1 = 'wine';
                        token2 = '';
                        lpPair = '';
                        asset = 'WINE';

                    }

                    console.log('hey')
                    console.log('protocol:', protocol)
                    console.log('pool:', pool);
                    let safeArgsW = {
                        protocol: protocol,
                        pool: pool,
                        amount: OldMoney.toBigNumber(amountOfLPTokensToRemove, 18)
                    };
                    let entity = registry.getEntityData(safeVineyardId);
                    console.log("////////////////////////// WITHDRAW LIQUIDITY FROM LP");
                    try {
                        const result = await poolclaimExecutor(new PoolClaimTask({
                            name: "poolclaim",
                            context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                            entity: { ABI: entity.ABI, address: entity.address, name: 'grape_wine_lp', hre: hre.ethers }
                        }), safeArgsW);
                        const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                        const delta = Math.abs(result.delta.wallet[asset]["amount"].toFixed(6));
                        const msg = `Withdraw [ ${delta} ${asset} ] from  ${asset}[tx: ${explorerLink} ]`;
                        taskSummary.push(msg)
                    } catch (err) {
                        console.log(err);
                        taskSummary.push(`Failed to withdraw liquidity from ${asset} at the Vineyard`)
                    }

                    console.log("////////////////////////// REMOVE LIQUIDITY FROM LP AT TRADERJOE");
                    const safeProtocolId = registry.findProtocol("traderjoe").id;
                    const safeAmount = safeAmountOfLPTokensToRemove;
                    const safeToken1Address = registry.findToken(token1).address;
                    const safeToken2Address = registry.findToken(token2).address;
                    const safeLiquidityPair = registry.findToken(lpPair).id;
                    const safeArgs = {
                        protocol: safeProtocolId,
                        token1Address: safeToken1Address,
                        token2Address: safeToken2Address,
                        liquidityPair: safeLiquidityPair,
                        amount: safeAmount
                    };
                    entity = registry.getEntityData(safeProtocolId);
                    ///////////////////////////////////////////////////////////////////

                    try {
                        const result = await removeLiquidityExecutor(new RemoveLiquidityTask({
                            name: "removeliquidity",
                            context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                            entity: { ABI: entity.ABI, address: entity.address, name: 'grape_wine_lp', hre: hre.ethers }
                        }), safeArgs);
                        const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;

                        const grapeWineDelta = result.delta.wallet["GRAPE_WINE_LP"] ? Math.abs(result.delta.wallet["GRAPE_WINE_LP"]["amount"].toFixed(6)) : 0.0;
                        const mimWineDelta = result.delta.wallet["MIM_WINE_LP"] ? Math.abs(result.delta.wallet["MIM_WINE_LP"]["amount"].toFixed(6)) : 0.0;
                        const grapeMimDelta = result.delta.wallet["GRAPE_MIM_LP"] ? Math.abs(result.delta.wallet["GRAPE_MIM_LP"]["amount"].toFixed(6)) : 0.0;
                        const grapeDelta = result.delta.wallet["GRAPE"] ? Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6)) : 0.0;
                        const wineDelta = result.delta.wallet["WINE"] ? Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6)) : 0.0;
                        const mimDelta = result.delta.wallet["MIM"] ? Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6)) : 0.0;

                        amountOfGrapeToSwapIntoUsdc = amountOfGrapeToSwapIntoUsdc + grapeDelta;
                        amountOfWineToSwapIntoUsdc = amountOfWineToSwapIntoUsdc + wineDelta;
                        amountOfMimToSwapIntoUsdc = amountOfMimToSwapIntoUsdc + mimDelta;

                        console.log('amountOfGrapeToSwapIntoUsdc:', amountOfGrapeToSwapIntoUsdc);
                        console.log('amountOfWineToSwapIntoUsdc:', amountOfWineToSwapIntoUsdc);
                        console.log('amountOfMimToSwapIntoUsdc:', amountOfMimToSwapIntoUsdc);

                        // const msg = `Removed [ ${grapeWineDelta} GRAPE-WINE-LP ] for [${grapeDelta} GRAPE] and [${wineDelta} WINE] from Trader Joe [tx: ${explorerLink} ]`;
                        const msg = `Removed LP from TraderJoe [tx: ${explorerLink} ]`
                        taskSummary.push(msg)
                        // taskSummary.push("Removed Liquidity from GRAPE-WINE-LP")

                    } catch (err) {
                        console.log("--> error:")
                        console.log(err);
                        taskSummary.push("Failed to Remove Liquidity from LP")
                    }

                }

            }







        }

        //////////////////////////////// SWAPS FOR MIM

        let mimPriceInUsdc = await traderJoeContract.getAmountsOut(OldMoney.toSafeMoneyWithLimit(1), [mimTokenAddress, usdcTokenAddress]);
        mimPriceInUsdc = ethers.utils.formatUnits(mimPriceInUsdc[1], 6);

        const safeAmountOfGrapeToSwapIntoUsdc = OldMoney.toBigNumber(amountOfGrapeToSwapIntoUsdc, 18);
        const safeAmountOfWineToSwapIntoUsdc = OldMoney.toBigNumber(amountOfWineToSwapIntoUsdc, 18);
        const safeAmountOfMimToSwapIntoUsdc = OldMoney.toBigNumber(amountOfMimToSwapIntoUsdc, 18);

        const amountOfGrapeToSwapIntoMim = amountOfGrapeToSwapIntoUsdc / mimPriceInUsdc;
        const safeAmountOfGrapeToSwapIntoMim = OldMoney.toBigNumber(amountOfGrapeToSwapIntoMim, 18);

        const amountOfWineToSwapIntoMim = amountOfWineToSwapIntoUsdc / mimPriceInUsdc;
        const safeAmountOfWineToSwapIntoMim = OldMoney.toBigNumber(amountOfWineToSwapIntoMim, 18);


        console.log('mimPriceInUsdc:', mimPriceInUsdc);

        console.log('amountOfGrapeToSwapIntoUsdc:', amountOfGrapeToSwapIntoUsdc);
        console.log('amountOfGrapeToSwapIntoMim :', amountOfGrapeToSwapIntoMim);

        console.log('amountOfWineToSwapIntoUsdc:', amountOfWineToSwapIntoUsdc);
        console.log('amountOfWineToSwapIntoMim :', amountOfWineToSwapIntoMim);

        // SWAP GRAPE FOR MIM
        if (origin) {

            if (amountOfGrapeToSwapIntoMim > 0) {
                const safeArgsA = {
                    protocol: safeTraderJoeId,
                    tokenInAddress: grapeTokenAddress,
                    tokenOutAddress: mimTokenAddress,
                    amount: safeAmountOfGrapeToSwapIntoMim
                };

                console.log("//////////////////////////SWAP GRAPE FOR MIM AT TRADERJOE");
                try {
                    const result = await swapTokensExecutor(
                        new SwapTokensTask({
                            name: "swaptokens",
                            context: {
                                address: account.address,
                                provider: hre.ethers.provider,
                                chain: chain,
                                run: EnvUtil.toNumber(FLOW_05_RUN_ID)
                            }, entity: { ABI: entity.ABI, address: entity.address, name: 'trade', hre: hre.ethers }
                        }),
                        safeArgsA);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const grapeDelta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                    const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                    const msg = `Swapped [ ${grapeDelta} GRAPE ] for [ ${mimDelta} MIM] at Trader Joe [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log("--> error:")
                    console.log(err);
                    taskSummary.push("Failed to swap GRAPE for MIM at Trader Joe")
                }
            }
        }
        if (origin) {

            if (amountOfWineToSwapIntoMim > 0) {
                const safeArgsA = {
                    protocol: safeTraderJoeId,
                    tokenInAddress: wineTokenAddress,
                    tokenOutAddress: mimTokenAddress,
                    amount: safeAmountOfWineToSwapIntoMim
                };

                console.log("//////////////////////////SWAP WINE FOR MIM AT TRADERJOE");
                try {
                    const result = await swapTokensExecutor(
                        new SwapTokensTask({
                            name: "swaptokens",
                            context: {
                                address: account.address,
                                provider: hre.ethers.provider,
                                chain: chain,
                                run: EnvUtil.toNumber(FLOW_05_RUN_ID)
                            }, entity: { ABI: entity.ABI, address: entity.address, name: 'trade', hre: hre.ethers }
                        }),
                        safeArgsA);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const wineDelta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                    const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                    const msg = `Swapped [ ${wineDelta} WINE ] for [ ${mimDelta} MIM] at Trader Joe [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log("--> error:")
                    console.log(err);
                    taskSummary.push("Failed to swap WINE for MIM at Trader Joe")
                }
            }
        }


        // SEND MIM
        console.log("////////////////////////// SEND MIM TO PERSON");

        let balancesBeforeTx = await getBalances();
        console.log('balances before tx:', balancesBeforeTx);

        let receiverAddress = registry.findPayrollAccount(person).address;
        let receiverAmount = Math.round((amount / mimPriceInUsdc) * 100) / 100;

        console.log('receiverAddress:', receiverAddress);
        console.log('receiverAmount:', receiverAmount);

        let bnAmount = OldMoney.toBigNumber(receiverAmount, 18);

        let tx = {
            to: receiverAddress,
            value: bnAmount
        }

        let theTx = await mimTokenContract.connect(account).transfer(receiverAddress, bnAmount)
        theTx.wait();
        console.log('theTx:', theTx);





        let balancesAfterTx = await getBalances();
        console.log('balances after tx:', balancesAfterTx);




    })

task("payroll", "run the payroll flow")
    .addOptionalParam("michael", "michael's payroll amount")
    .addOptionalParam("matt", "matt's payroll amount")
    .addOptionalParam("mukhtar", "mukhtar's payroll amount")
    .addOptionalParam("dan", "dan's payroll amount")
    .setAction(async (taskArgs, hre) => {

        let michaelPayrollAmount = 0.0;
        let mattPayrollAmount = 0.0;
        let mukhtarPayrollAmount = 0.0;
        let danPayrollAmount = 0.0;

        if (taskArgs["michael"]) {
            michaelPayrollAmount = parseFloat(taskArgs["michael"]);
        } else {
            michaelPayrollAmount = parseFloat(registry.findPayrollAccount('michael').amount);
        }

        if (taskArgs["matt"]) {
            mattPayrollAmount = parseFloat(taskArgs["matt"]);

        } else {
            mattPayrollAmount = parseFloat(registry.findPayrollAccount('matt').amount);
        }

        if (taskArgs["mukhtar"]) {
            mukhtarPayrollAmount = parseFloat(taskArgs["mukhtar"]);
        } else {
            mukhtarPayrollAmount = parseFloat(registry.findPayrollAccount('mukhtar').amount);
        }

        if (taskArgs["dan"]) {
            danPayrollAmount = parseFloat(taskArgs["dan"]);
        } else {
            danPayrollAmount = parseFloat(registry.findPayrollAccount('dan').amount);
        }


        setEnvironment(hre);
        console.log("running pay flow...")
        let taskSummary: Array<string> = [];
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            F4T1A: FLOW_04_TASK_01_MIN_AMOUNT_OF_MIM_TO_START,
            F4T1B: FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_REWARDS_TO_START,
            F4T1E: FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_IN_WALLET,
            F4T1F: FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_GRAPE_LP,
            F4T1G: FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_MIM_LP
        };

        const safeF4T1A = EnvUtil.toNumber(unsafeArgs.F4T1A);
        const safeF4T1B = EnvUtil.toNumber(unsafeArgs.F4T1B);
        const safeF4T1D = OldMoney.toSafeMoneyWithLimit(0); //  by default, we don't withdraw from the LP by default when we claim
        const safeF4T1E = EnvUtil.toNumber(unsafeArgs.F4T1E);
        const safeF4T1F = EnvUtil.toNumber(unsafeArgs.F4T1F);
        const safeF4T1G = EnvUtil.toNumber(unsafeArgs.F4T1F);

        const safeTraderJoeId = registry.findProtocol("traderjoe").id;
        const safeVineyardId = registry.findProtocol("grapefinance-vineyard").id;
        const safeWineryId = registry.findProtocol("grapefinance-winery").id;
        const safeGrapeMIMPoolId = "grapemimlp";
        const safeMIMWinePoolId = "mimwinelp";
        const safeGrapeWinePoolId = "grapewinelp";
        const safeNodeWineId = "grapefinance-winenode";
        const safeNodeGrapeId = "grapefinance-grapenode";

        const traderJoeContractAddress = registry.findProtocol("traderjoe").address;

        const grapeTokenAddress = registry.findToken("grape").address;
        const wineTokenAddress = registry.findToken("wine").address;
        const mimTokenAddress = registry.findToken("mim").address;
        const usdcTokenAddress = registry.findToken("usdc").address
        const grapeWineLPTokenAddress = registry.findToken("grape-wine-lp").address;
        const mimWineLPTokenAddress = registry.findToken("mim-wine-lp").address;
        const grapeMIMLPTokenAddress = registry.findToken("grape-mim-lp").address;

        const traderJoeContract = await ethers.getContractAt(TRADERJOE_ABI, traderJoeContractAddress);

        const grapeTokenContract = await ethers.getContractAt(ERC20_ABI, grapeTokenAddress);
        const wineTokenContract = await ethers.getContractAt(ERC20_ABI, wineTokenAddress);
        const mimTokenContract = await ethers.getContractAt(ERC20_ABI, mimTokenAddress);
        const grapeMIMLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeMIMLPTokenAddress);
        const grapeWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeWineLPTokenAddress);
        const mimWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, mimWineLPTokenAddress);

        const account: SignerWithAddress = await getAccount();
        const accountAddress = account.address;
        let entity = registry.getEntityData(safeVineyardId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);

        let balanceState = await getBalances();
        console.log('balanceState:', balanceState);

        // 1. Calc the value of GRAPE, WINE, MIM in wallet

        // let salariesValue = registry.getPayrollValue();
        let salariesValue = michaelPayrollAmount + mattPayrollAmount + mukhtarPayrollAmount + danPayrollAmount;
        console.log("salariesValue:", salariesValue);

        let assetsWalletValue = 0.0;
        let bucketsValue = 0.0;

        for (var [k, v] of Object.entries(balanceState["wallet"])) {
            if (k === 'GRAPE' || k === 'WINE' || k === 'MIM') {
                assetsWalletValue = assetsWalletValue + parseFloat(v.value);
            }

        }
        console.log('assetsWalletValue:', assetsWalletValue);

        for (var [k, v] of Object.entries(balanceState["buckets"])) {
            if (k === 'VINEYARD_GRAPE_WINE_LP_STAKED' || k === 'VINEYARD_MIM_WINE_LP_STAKED"' || k === 'VINEYARD_GRAPE_MIM_LP_STAKED' || k === 'VINEYARD_GRAPE_STAKED' || k === 'WINERY_WINE_STAKED') {
                bucketsValue = bucketsValue + parseFloat(v.value);
            }
        }
        console.log('bucketsValue:', bucketsValue);

        let amountOfGrapeToSwapIntoUsdc = 0.0;
        let amountOfWineToSwapIntoUsdc = 0.0;
        let amountOfMimToSwapIntoUsdc = 0.0;

        if ((bucketsValue + assetsWalletValue) < salariesValue) {
            throw ("the amount of value in wallet+buckets is not enough to cover the salaries value.")
        }

        if (assetsWalletValue < salariesValue) {
            // remove from LPs
            // 1. determine which one is the smallest LP.


            const payable = salariesValue;

            const a = parseFloat(balanceState["buckets"]["VINEYARD_GRAPE_WINE_LP_STAKED"]["value"]);
            const b = parseFloat(balanceState["buckets"]["VINEYARD_MIM_WINE_LP_STAKED"]["value"]);
            const c = parseFloat(balanceState["buckets"]["VINEYARD_GRAPE_MIM_LP_STAKED"]["value"]);
            const d = parseFloat(balanceState["buckets"]["VINEYARD_GRAPE_STAKED"]["value"]);
            const e = parseFloat(balanceState["buckets"]["WINERY_WINE_STAKED"]["value"]);

            const aP = balanceState["buckets"]["VINEYARD_GRAPE_WINE_LP_STAKED"]["price"];
            const bP = balanceState["buckets"]["VINEYARD_MIM_WINE_LP_STAKED"]["price"];
            const cP = balanceState["buckets"]["VINEYARD_GRAPE_MIM_LP_STAKED"]["price"];
            const dP = balanceState["buckets"]["VINEYARD_GRAPE_STAKED"]["price"];
            const eP = balanceState["buckets"]["WINERY_WINE_STAKED"]["price"];

            const buckets = a + b + c + d + e;
            const n = 5; // amount of buckets

            const level = ((buckets) / n) - (payable / n);

            console.log('a:', a);
            console.log('b:', b);
            console.log('c:', c);
            console.log('d:', d);
            console.log('e:', e);

            console.log('buckets:', buckets);
            console.log('n:', n);
            console.log('payable:', payable);

            console.log('level:', level);


            const diff = await getBucketsValueDiff(balanceState, level);
            console.log('diff:', diff);

            const aD = parseFloat(diff["buckets"]["VINEYARD_GRAPE_WINE_LP_STAKED"]["value"]);
            const bD = parseFloat(diff["buckets"]["VINEYARD_MIM_WINE_LP_STAKED"]["value"]);
            const cD = parseFloat(diff["buckets"]["VINEYARD_GRAPE_MIM_LP_STAKED"]["value"]);
            const dD = parseFloat(diff["buckets"]["VINEYARD_GRAPE_STAKED"]["value"]);
            const eD = parseFloat(diff["buckets"]["WINERY_WINE_STAKED"]["value"]);

            // 1. GRAPE-WINE-LP
            if (aD < 0) {

                const amountOfGrapeWineLPTokensToRemove = Math.ceil((Math.abs(aD) / aP) * 100) / 100;
                const safeAmountOfGrapeWineLPTokensToRemove = OldMoney.toBigNumber(amountOfGrapeWineLPTokensToRemove, 18);

                console.log('amountOfGrapeWineLPTokensToRemove:', amountOfGrapeWineLPTokensToRemove)


                // withdraw liquidity from GRAPE-WINE-LP at the Vineyard


                let safeArgsW = {
                    protocol: safeVineyardId,
                    pool: safeGrapeWinePoolId,
                    amount: OldMoney.toBigNumber(amountOfGrapeWineLPTokensToRemove, 18)
                };
                let entity = registry.getEntityData(safeVineyardId);
                console.log("////////////////////////// WITHDRAW LIQUIDITY FROM GRAPE-WINE-LP AT VINEYARD");
                try {
                    const result = await poolclaimExecutor(new PoolClaimTask({
                        name: "poolclaim",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'grape_wine_lp', hre: hre.ethers }
                    }), safeArgsW);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const delta = Math.abs(result.delta.wallet["GRAPE_WINE_LP"]["amount"].toFixed(6));
                    const msg = `Withdraw [ ${delta} GRAPE-WINE-LP ] from GRAPE-WINE-LP at the Vineyard [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log(err);
                    taskSummary.push("Failed to withdraw liquidity from GRAPE-WINE-LP at the Vineyard")
                }

                console.log("////////////////////////// REMOVE LIQUIDITY FROM GRAPE-WINE-LP AT TRADERJOE");
                const safeProtocolId = registry.findProtocol("traderjoe").id;
                const safeAmount = safeAmountOfGrapeWineLPTokensToRemove;
                const safeToken1Address = registry.findToken("grape").address;
                const safeToken2Address = registry.findToken("wine").address;
                const safeLiquidityPair = registry.findToken("grape-wine-lp").id;
                const safeArgs = {
                    protocol: safeProtocolId,
                    token1Address: safeToken1Address,
                    token2Address: safeToken2Address,
                    liquidityPair: safeLiquidityPair,
                    amount: safeAmount
                };
                entity = registry.getEntityData(safeProtocolId);
                ///////////////////////////////////////////////////////////////////

                try {
                    const result = await removeLiquidityExecutor(new RemoveLiquidityTask({
                        name: "removeliquidity",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'grape_wine_lp', hre: hre.ethers }
                    }), safeArgs);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const grapeWineDelta = Math.abs(result.delta.wallet["GRAPE_WINE_LP"]["amount"].toFixed(6));
                    const grapeDelta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                    const wineDelta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));

                    amountOfGrapeToSwapIntoUsdc = amountOfGrapeToSwapIntoUsdc + grapeDelta;
                    amountOfWineToSwapIntoUsdc = amountOfWineToSwapIntoUsdc + wineDelta;

                    const msg = `Removed [ ${grapeWineDelta} GRAPE-WINE-LP ] for [${grapeDelta} GRAPE] and [${wineDelta} WINE] from Trader Joe [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                    // taskSummary.push("Removed Liquidity from GRAPE-WINE-LP")

                } catch (err) {
                    console.log("--> error:")
                    console.log(err);
                    taskSummary.push("Failed to Remove Liquidity from GRAPE-WINE-LP")
                }





            }

            // 2. MIM-WINE-LP
            if (bD < 0) {

                const amountOfMimWineLPTokensToRemove = Math.ceil((Math.abs(bD) / bP) * 100) / 100;
                const safeAmountOfMimWineLPTokensToRemove = OldMoney.toBigNumber(amountOfMimWineLPTokensToRemove, 18);

                console.log('amountOfMimWineLPTokensToRemove:', amountOfMimWineLPTokensToRemove)


                let safeArgsW = {
                    protocol: safeVineyardId,
                    pool: safeMIMWinePoolId,
                    amount: OldMoney.toBigNumber(amountOfMimWineLPTokensToRemove, 18)
                };
                let entity = registry.getEntityData(safeVineyardId);
                console.log("////////////////////////// WITHDRAW LIQUIDITY FROM MIM-WINE-LP AT VINEYARD");
                try {
                    const result = await poolclaimExecutor(new PoolClaimTask({
                        name: "poolclaim",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'mim_wine_lp', hre: hre.ethers }
                    }), safeArgsW);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const delta = Math.abs(result.delta.wallet["MIM_WINE_LP"]["amount"].toFixed(6));
                    const msg = `Withdraw [ ${delta} MIM-WINE-LP ] from MIM-WINE-LP at the Vineyard [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log(err);
                    taskSummary.push("Failed to withdraw liquidity from MIM-WINE-LP at the Vineyard")
                }

                console.log("////////////////////////// REMOVE LIQUIDITY FROM MIM-WINE-LP AT TRADERJOE");
                const safeProtocolId = registry.findProtocol("traderjoe").id;
                const safeAmount = safeAmountOfMimWineLPTokensToRemove;
                const safeToken1Address = registry.findToken("mim").address;
                const safeToken2Address = registry.findToken("wine").address;
                const safeLiquidityPair = registry.findToken("mim-wine-lp").id;
                const safeArgs = {
                    protocol: safeProtocolId,
                    token1Address: safeToken1Address,
                    token2Address: safeToken2Address,
                    liquidityPair: safeLiquidityPair,
                    amount: safeAmount
                };
                entity = registry.getEntityData(safeProtocolId);
                ///////////////////////////////////////////////////////////////////

                try {
                    const result = await removeLiquidityExecutor(new RemoveLiquidityTask({
                        name: "removeliquidity",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'mim_wine_lp', hre: hre.ethers }
                    }), safeArgs);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const mimWineDelta = Math.abs(result.delta.wallet["MIM_WINE_LP"]["amount"].toFixed(6));
                    const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                    const wineDelta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));

                    amountOfMimToSwapIntoUsdc = amountOfMimToSwapIntoUsdc + mimDelta;
                    amountOfWineToSwapIntoUsdc = amountOfWineToSwapIntoUsdc + wineDelta;

                    const msg = `Removed [ ${mimWineDelta} MIM-WINE-LP ] for [${mimDelta} MIM] and [${wineDelta} WINE] from Trader Joe [tx: ${explorerLink} ]`;
                    taskSummary.push(msg);
                    // taskSummary.push("Removed Liquidity from MIM-WINE-LP")
                } catch (err) {
                    console.log("--> error:");
                    console.log(err);
                    taskSummary.push("Failed to Remove Liquidity from MIM-WINE-LP")
                }


            }

            // 3. GRAPE-MIM-LP
            if (cD < 0) {

                const amountOfGrapeMimLPTokensToRemove = Math.ceil((Math.abs(cD) / cP) * 100) / 100;
                const safeAmountOfGrapeMimLPTokensToRemove = OldMoney.toBigNumber(amountOfGrapeMimLPTokensToRemove, 18);

                console.log('amountOfGrapeMimLPTokensToRemove:', amountOfGrapeMimLPTokensToRemove)

                let safeArgsW = {
                    protocol: safeVineyardId,
                    pool: safeGrapeMIMPoolId,
                    amount: OldMoney.toBigNumber(amountOfGrapeMimLPTokensToRemove, 18)
                };
                let entity = registry.getEntityData(safeVineyardId);
                console.log("////////////////////////// WITHDRAW LIQUIDITY FROM GRAPE-MIM-LP AT VINEYARD");
                try {
                    const result = await poolclaimExecutor(new PoolClaimTask({
                        name: "poolclaim",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'grape_mim_lp', hre: hre.ethers }
                    }), safeArgsW);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const delta = Math.abs(result.delta.wallet["GRAPE_MIM_LP"]["amount"].toFixed(6));
                    const msg = `Withdraw [ ${delta} GRAPE-MIM-LP ] from GRAPE-MIM-LP at the Vineyard [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log(err);
                    taskSummary.push("Failed to withdraw liquidity from GRAPE-MIM-LP at the Vineyard")
                }

                console.log("////////////////////////// REMOVE LIQUIDITY FROM GRAPE-MIM-LP AT TRADERJOE");
                const safeProtocolId = registry.findProtocol("traderjoe").id;
                const safeAmount = safeAmountOfGrapeMimLPTokensToRemove;
                const safeToken1Address = registry.findToken("grape").address;
                const safeToken2Address = registry.findToken("mim").address;
                const safeLiquidityPair = registry.findToken("grape-mim-lp").id;
                const safeArgs = {
                    protocol: safeProtocolId,
                    token1Address: safeToken1Address,
                    token2Address: safeToken2Address,
                    liquidityPair: safeLiquidityPair,
                    amount: safeAmount
                };
                entity = registry.getEntityData(safeProtocolId);
                ///////////////////////////////////////////////////////////////////

                try {
                    const result = await removeLiquidityExecutor(new RemoveLiquidityTask({
                        name: "removeliquidity",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'grape_mim_lp', hre: hre.ethers }
                    }), safeArgs);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const grapeMimDelta = Math.abs(result.delta.wallet["GRAPE_MIM_LP"]["amount"].toFixed(6));
                    const grapeDelta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                    const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));

                    amountOfGrapeToSwapIntoUsdc = amountOfGrapeToSwapIntoUsdc + grapeDelta;
                    amountOfMimToSwapIntoUsdc = amountOfMimToSwapIntoUsdc + mimDelta;

                    const msg = `Removed [ ${grapeMimDelta} GRAPE-MIM-LP ] for [${grapeDelta} GRAPE] and [${mimDelta} MIM] from Trader Joe [tx: ${explorerLink} ]`;
                    taskSummary.push(msg);
                    // taskSummary.push("Removed Liquidity from GRAPE-MIM-LP")
                } catch (err) {
                    console.log("--> error:");
                    console.log(err);
                    taskSummary.push("Failed to Remove Liquidity from GRAPE-MIM-LP");
                }

            }

            // 4. GRAPE-STAKED
            if (dD < 0) {

                const amountOfGrapeStakedTokensToRemove = Math.ceil((Math.abs(dD) / dP) * 100) / 100;
                const safeAmountOfGrapeStakedTokensToRemove = OldMoney.toBigNumber(amountOfGrapeStakedTokensToRemove, 18);

                console.log('amountOfGrapeStakedTokensToRemove:', amountOfGrapeStakedTokensToRemove);

                // withdraw GRAPE staked at the Vineyard


                let safeArgsW = {
                    protocol: safeVineyardId,
                    pool: "vineyard",
                    amount: OldMoney.toBigNumber(amountOfGrapeStakedTokensToRemove, 18)
                };
                let entity = registry.getEntityData(safeVineyardId);
                console.log("////////////////////////// WITHDRAW GRAPE STAKED AT THE VINEYARD");
                try {
                    const result = await poolclaimExecutor(new PoolClaimTask({
                        name: "poolclaim",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'grape', hre: hre.ethers }
                    }), safeArgsW);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const delta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));

                    amountOfGrapeToSwapIntoUsdc = amountOfGrapeToSwapIntoUsdc + delta;

                    const msg = `Withdraw [ ${delta} GRAPE ] from VINEYARD_GRAPE_STAKED at the Vineyard [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log(err);
                    taskSummary.push("Failed to withdraw GRAPE staked at the Vineyard")
                }


            }

            // 5. WINE-STAKED
            if (eD < 0) {

                const amountOfWineStakedTokensToRemove = Math.ceil((Math.abs(eD) / eP) * 100) / 100;
                const safeAmountOfWineStakedTokensToRemove = OldMoney.toBigNumber(amountOfWineStakedTokensToRemove, 18);

                console.log('amountOfWineStakedTokensToRemove:', amountOfWineStakedTokensToRemove);

                // withdraw GRAPE staked at the Vineyard




                let safeArgsW = {
                    protocol: safeWineryId,
                    pool: "winery",
                    amount: OldMoney.toBigNumber(amountOfWineStakedTokensToRemove, 18)
                };
                let entity = registry.getEntityData(safeWineryId);
                console.log("////////////////////////// WITHDRAW WINE STAKED AT THE WINERY");
                try {
                    const result = await withdrawExecutor(new WithdrawTask({
                        name: "withdraw",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'wine', hre: hre.ethers }
                    }), safeArgsW);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const delta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));

                    amountOfWineToSwapIntoUsdc = amountOfWineToSwapIntoUsdc + delta;

                    const msg = `Withdraw [ ${delta} WINE ] from WINERY_WINE_STAKED at the Winery [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log(err);
                    taskSummary.push("Failed to withdraw WINE staked at the Winery")
                }

            }







            // calc what would you obtain removing the others
            // if more is needed, divide into n into number of lps and remove equally.
        } else {
            // check if mim is enough?
            // check if grape is enough?
            // sell exact wine amount
            const a = parseFloat(balanceState["wallet"]["MIM"]["value"]);
            const b = parseFloat(balanceState["wallet"]["GRAPE"]["value"]);
            const c = parseFloat(balanceState["wallet"]["WINE"]["value"]);

            if (a > salariesValue) {
                // pay in mim
                amountOfMimToSwapIntoUsdc = salariesValue;

            } else if ((a + b) > salariesValue) {
                //sell mim, check what
                amountOfMimToSwapIntoUsdc = a;
                amountOfGrapeToSwapIntoUsdc = salariesValue - a;

            } else if ((a + b + c) > salariesValue) {

                amountOfMimToSwapIntoUsdc = a;
                amountOfGrapeToSwapIntoUsdc = b;
                amountOfWineToSwapIntoUsdc = salariesValue - a - b;

            }

        }

        //////////////////////////////// SWAPS FOR MIM

        let mimPriceInUsdc = await traderJoeContract.getAmountsOut(OldMoney.toSafeMoneyWithLimit(1), [mimTokenAddress, usdcTokenAddress]);
        mimPriceInUsdc = ethers.utils.formatUnits(mimPriceInUsdc[1], 6);

        const safeAmountOfGrapeToSwapIntoUsdc = OldMoney.toBigNumber(amountOfGrapeToSwapIntoUsdc, 18);
        const safeAmountOfWineToSwapIntoUsdc = OldMoney.toBigNumber(amountOfWineToSwapIntoUsdc, 18);
        const safeAmountOfMimToSwapIntoUsdc = OldMoney.toBigNumber(amountOfMimToSwapIntoUsdc, 18);

        const amountOfGrapeToSwapIntoMim = amountOfGrapeToSwapIntoUsdc / mimPriceInUsdc;
        const safeAmountOfGrapeToSwapIntoMim = OldMoney.toBigNumber(amountOfGrapeToSwapIntoMim, 18);

        const amountOfWineToSwapIntoMim = amountOfWineToSwapIntoUsdc / mimPriceInUsdc;
        const safeAmountOfWineToSwapIntoMim = OldMoney.toBigNumber(amountOfWineToSwapIntoMim, 18);


        console.log('mimPriceInUsdc:', mimPriceInUsdc);

        console.log('amountOfGrapeToSwapIntoUsdc:', amountOfGrapeToSwapIntoUsdc);
        console.log('amountOfGrapeToSwapIntoMim :', amountOfGrapeToSwapIntoMim);

        console.log('amountOfWineToSwapIntoUsdc:', amountOfWineToSwapIntoUsdc);
        console.log('amountOfWineToSwapIntoMim :', amountOfWineToSwapIntoMim);

        // SWAP GRAPE FOR MIM

        if (amountOfGrapeToSwapIntoMim > 0) {
            const safeArgsA = {
                protocol: safeTraderJoeId,
                tokenInAddress: grapeTokenAddress,
                tokenOutAddress: mimTokenAddress,
                amount: safeAmountOfGrapeToSwapIntoMim
            };

            console.log("//////////////////////////SWAP GRAPE FOR MIM AT TRADERJOE");
            try {
                const result = await swapTokensExecutor(
                    new SwapTokensTask({
                        name: "swaptokens",
                        context: {
                            address: account.address,
                            provider: hre.ethers.provider,
                            chain: chain,
                            run: EnvUtil.toNumber(FLOW_05_RUN_ID)
                        }, entity: { ABI: entity.ABI, address: entity.address, name: 'trade', hre: hre.ethers }
                    }),
                    safeArgsA);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const grapeDelta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                const msg = `Swapped [ ${grapeDelta} GRAPE ] for [ ${mimDelta} MIM] at Trader Joe [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log("--> error:")
                console.log(err);
                taskSummary.push("Failed to swap GRAPE for MIM at Trader Joe")
            }
        }

        if (amountOfWineToSwapIntoMim > 0) {
            const safeArgsA = {
                protocol: safeTraderJoeId,
                tokenInAddress: wineTokenAddress,
                tokenOutAddress: mimTokenAddress,
                amount: safeAmountOfWineToSwapIntoMim
            };

            console.log("//////////////////////////SWAP WINE FOR MIM AT TRADERJOE");
            try {
                const result = await swapTokensExecutor(
                    new SwapTokensTask({
                        name: "swaptokens",
                        context: {
                            address: account.address,
                            provider: hre.ethers.provider,
                            chain: chain,
                            run: EnvUtil.toNumber(FLOW_05_RUN_ID)
                        }, entity: { ABI: entity.ABI, address: entity.address, name: 'trade', hre: hre.ethers }
                    }),
                    safeArgsA);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const wineDelta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                const msg = `Swapped [ ${wineDelta} WINE ] for [ ${mimDelta} MIM] at Trader Joe [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log("--> error:")
                console.log(err);
                taskSummary.push("Failed to swap WINE for MIM at Trader Joe")
            }
        }



        // SEND MIM
        console.log("////////////////////////// SEND MIM TO MICHAEL");

        let receiverAddress = registry.findPayrollAccount('michael').address;
        let receiverAmount = michaelPayrollAmount;

        let bnAmount = OldMoney.toBigNumber(receiverAmount, 18);

        let tx = {
            to: receiverAddress,
            value: bnAmount
        }

        let theTx = await mimTokenContract.connect(account).transfer(receiverAddress, bnAmount)
        theTx.wait();
        console.log('theTx:', theTx);


        console.log("////////////////////////// SEND MIM TO MATT");

        receiverAddress = registry.findPayrollAccount('matt').address;
        receiverAmount = mattPayrollAmount;

        bnAmount = OldMoney.toBigNumber(receiverAmount, 18);

        tx = {
            to: receiverAddress,
            value: bnAmount
        }

        theTx = await mimTokenContract.connect(account).transfer(receiverAddress, bnAmount)
        theTx.wait();
        console.log('theTx:', theTx);

        console.log("////////////////////////// SEND MIM TO MUKHTAR");

        receiverAddress = registry.findPayrollAccount('mukhtar').address;
        receiverAmount = mukhtarPayrollAmount;

        bnAmount = OldMoney.toBigNumber(receiverAmount, 18);

        tx = {
            to: receiverAddress,
            value: bnAmount
        }

        theTx = await mimTokenContract.connect(account).transfer(receiverAddress, bnAmount)
        theTx.wait();
        console.log('theTx:', theTx);

        console.log("////////////////////////// SEND MIM TO DAN");

        receiverAddress = registry.findPayrollAccount('dan').address;
        receiverAmount = danPayrollAmount;

        bnAmount = OldMoney.toBigNumber(receiverAmount, 18);

        tx = {
            to: receiverAddress,
            value: bnAmount
        }

        theTx = await mimTokenContract.connect(account).transfer(receiverAddress, bnAmount)
        theTx.wait();
        console.log('theTx:', theTx);



        let balances = await getBalances();
        console.log('balances:', balances);



    })

task("grapeFlow05", "execute flow for Grape Finance")
    .setAction(async (taskArgs, hre) => {
        setEnvironment(hre);
        let taskSummary: Array<string> = [];
        ///////////////////////////////////////////////////////////////////
        const unsafeArgs = {
            F4T1A: FLOW_04_TASK_01_MIN_AMOUNT_OF_MIM_TO_START,
            F4T1B: FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_REWARDS_TO_START,
            F4T1E: FLOW_04_TASK_01_MIN_AMOUNT_OF_WINE_IN_WALLET,
            F4T1F: FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_GRAPE_LP,
            F4T1G: FLOW_04_TASK_01_PERCENTAGE_OF_WINE_TO_STAKE_INTO_WINE_MIM_LP
        };

        const safeF4T1A = EnvUtil.toNumber(unsafeArgs.F4T1A);
        const safeF4T1B = EnvUtil.toNumber(unsafeArgs.F4T1B);
        const safeF4T1D = OldMoney.toSafeMoneyWithLimit(0); //  by default, we don't withdraw from the LP by default when we claim
        const safeF4T1E = EnvUtil.toNumber(unsafeArgs.F4T1E);
        const safeF4T1F = EnvUtil.toNumber(unsafeArgs.F4T1F);
        const safeF4T1G = EnvUtil.toNumber(unsafeArgs.F4T1F);

        const safeTraderJoeId = registry.findProtocol("traderjoe").id;
        const safeVineyardId = registry.findProtocol("grapefinance-vineyard").id;
        const safeWineryId = registry.findProtocol("grapefinance-winery").id;
        const safeGrapeMIMPoolId = "grapemimlp";
        const safeMIMWinePoolId = "mimwinelp";
        const safeGrapeWinePoolId = "grapewinelp";
        const safeNodeWineId = "grapefinance-winenode";
        const safeNodeGrapeId = "grapefinance-grapenode";

        const traderJoeContractAddress = registry.findProtocol("traderjoe").address;

        const grapeTokenAddress = registry.findToken("grape").address;
        const wineTokenAddress = registry.findToken("wine").address;
        const mimTokenAddress = registry.findToken("mim").address;
        const grapeWineLPTokenAddress = registry.findToken("grape-wine-lp").address;
        const mimWineLPTokenAddress = registry.findToken("mim-wine-lp").address;
        const grapeMIMLPTokenAddress = registry.findToken("grape-mim-lp").address;

        const traderJoeContract = await ethers.getContractAt(TRADERJOE_ABI, traderJoeContractAddress);

        const grapeTokenContract = await ethers.getContractAt(ERC20_ABI, grapeTokenAddress);
        const wineTokenContract = await ethers.getContractAt(ERC20_ABI, wineTokenAddress);
        const mimTokenContract = await ethers.getContractAt(ERC20_ABI, mimTokenAddress);
        const grapeMIMLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeMIMLPTokenAddress);
        const grapeWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, grapeWineLPTokenAddress);
        const mimWineLPTokenContract = await ethers.getContractAt(ERC20_ABI, mimWineLPTokenAddress);

        const account: SignerWithAddress = await getAccount();
        const accountAddress = account.address;
        let entity = registry.getEntityData(safeVineyardId);
        const chain = registry.findChainByChainId(hre.network.config.chainId);

        interface walletBalance {
            address: string;
            mim: number;
            wine: number;
        }

        const balance: walletBalance = {
            address: accountAddress,
            mim: 0,
            wine: 0

        };
        let balanceState = await getBalances();
        const balancePre = balanceState;
        // taskSummary.push(`Checked the initial balances: ${JSON.stringify(balanceState)}`);

        // 1. Check the available MIM balance
        let mimTokenBalance = await mimTokenContract.balanceOf(accountAddress);
        mimTokenBalance = OldMoney.parseAmount(mimTokenBalance);
        console.log("mimTokenBalance:", mimTokenBalance);

        if (mimTokenBalance < safeF4T1A) {
            console.log("! --> amount of MIM in wallet is not above threshold. Cancelling script...");
            process.exit();
            // throw new Error('amount of MIM in wallet is not above threshold.');
        }

        // 2. Claim WINE from each pool
        // 2.1. claim WINE from GRAPE-MIM-LP
        if (balanceState['buckets']["VINEYARD_GRAPE_MIM_LP_WINE_CLAIMABLE"]["amount"] > EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)) {
            let safeArgs = {
                protocol: safeVineyardId,
                pool: safeGrapeMIMPoolId,
                amount: BigNumber.from(0)
            };
            console.log("//////////////////////////CLAIM WINE FROM GRAPE-MIM-LP");
            try {
                const result = await poolclaimExecutor(new PoolClaimTask({
                    name: "poolclaim",
                    context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: 1 },
                    entity: { ABI: entity.ABI, address: entity.address, name: 'grape_mim_lp', hre: hre.ethers }
                }), safeArgs);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const delta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                const msg = `Claimed [ ${delta} WINE ] from GRAPE-MIM-LP [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log(err);
                taskSummary.push("Failed to claim WINE from GRAPE-MIM-LP")
            }
        } else {
            const msg = `Skipped claiming WINE from VINEYARD_GRAPE_MIM_LP. WINE Claimable: ${balanceState["buckets"]["VINEYARD_GRAPE_MIM_LP_WINE_CLAIMABLE"]["amount"].toFixed(4)}, Minimum threshold: ${EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)}`;
            taskSummary.push(msg);
            console.log(msg);
        }


        // 2.2. claim WINE from WINE-MIM-LP
        console.log('balanceState["buckets"]["VINEYARD_MIM_WINE_LP_WINE_CLAIMABLE"]["amount"]: ');
        console.log(balanceState["buckets"]["VINEYARD_MIM_WINE_LP_WINE_CLAIMABLE"]["amount"]);
        console.log('EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE):');
        console.log(EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE));
        if (balanceState["buckets"]["VINEYARD_MIM_WINE_LP_WINE_CLAIMABLE"]["amount"] > EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)) {
            let safeArgs = {
                protocol: safeVineyardId,
                pool: safeMIMWinePoolId,
                amount: BigNumber.from(0)
            };
            console.log("//////////////////////////CLAIM WINE FROM WINE-MIM-LP ");
            try {
                const result = await poolclaimExecutor(new PoolClaimTask({
                    name: "poolclaim",
                    context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                    entity: { ABI: entity.ABI, address: entity.address, name: 'wine_mim_lp', hre: hre.ethers }
                }), safeArgs);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const delta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                const msg = `Claimed [ ${delta} WINE ] from WINE-MIM-LP [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log(err);
                taskSummary.push("Failed to claim WINE from WINE-MIM-LP")
            }
        } else {
            const msg = `Skipped claiming WINE from VINEYARD_WINE_MIM_LP. WINE Claimable: ${balanceState["buckets"]["VINEYARD_MIM_WINE_LP_WINE_CLAIMABLE"]["amount"].toFixed(4)}, Minimum threshold: ${EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)}`;
            taskSummary.push(msg);
            console.log(msg);
        }

        // 2.3. claim WINE from GRAPE-WINE-LP
        if (balanceState["buckets"]["VINEYARD_GRAPE_WINE_LP_WINE_CLAIMABLE"]["amount"] > EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)) {
            let safeArgs = {
                protocol: safeVineyardId,
                pool: safeGrapeWinePoolId,
                amount: BigNumber.from(0)
            };
            console.log("//////////////////////////CLAIM WINE FROM GRAPE-WINE-LP");
            try {
                const result = await poolclaimExecutor(new PoolClaimTask({
                    name: "poolclaim",
                    context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                    entity: { ABI: entity.ABI, address: entity.address, name: 'grape_wine_lp', hre: hre.ethers }
                }), safeArgs);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const delta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                const msg = `Claimed [ ${delta} WINE ] from GRAPE-WINE-LP [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log(err);
                taskSummary.push("Failed to claim WINE from GRAPE-WINE-LP")
            }
        } else {
            const msg = `Skipped claiming WINE from VINEYARD_GRAPE_WINE_LP. WINE Claimable: ${balanceState["buckets"]["VINEYARD_GRAPE_WINE_LP_WINE_CLAIMABLE"]["amount"].toFixed(4)}, Minimum threshold: ${EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)}`;
            taskSummary.push(msg);
            console.log(msg);
        }


        // 2.3. claim GRAPE from WINERY
        if (balanceState["buckets"]["WINERY_GRAPE_CLAIMABLE"]["amount"] > EnvUtil.toNumber(FLOW_05_MIN_GRAPE_CLAIMABLE)) {

            entity = registry.getEntityData("grapefinance-winery");
            try {
                const safeArgsClaimGrape = {
                    protocol: safeWineryId
                };
                console.log("//////////////////////////CLAIM GRAPE FROM WINERY");
                const result = await claimExecutor(new ClaimTask({
                    name: "claim",
                    context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                    entity: { ABI: entity.ABI, address: entity.address, name: 'winery', hre: hre.ethers }
                }), safeArgsClaimGrape);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const delta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                const msg = `Claimed [ ${delta} GRAPE ] from WINERY [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log("--> error:")
                console.log(err);
                taskSummary.push("Failed to claim GRAPE from WINERY")
            }
        } else {
            const msg = `Skipped claiming GRAPE from WINERY. GRAPE Claimable: ${balanceState["buckets"]["WINERY_GRAPE_CLAIMABLE"]["amount"].toFixed(4)}, Minimum threshold: ${EnvUtil.toNumber(FLOW_05_MIN_GRAPE_CLAIMABLE)}`;
            taskSummary.push(msg);
            console.log(msg);
        }

        // 2.4 claim WINE from NODE-WINE
        if (balanceState["buckets"]["NODES_WINE_CLAIMABLE"]["amount"] > EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)) {

            entity = registry.getEntityData(safeNodeWineId);
            try {
                const safeArgsClaimNodeWine = {
                    protocol: safeNodeWineId
                };
                console.log("////////////////////////// CLAIM WINE FROM NODE-WINE");
                const result = await claimExecutor(new ClaimTask({
                    name: "claim",
                    context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                    entity: { ABI: entity.ABI, address: entity.address, name: 'nodes_wine', hre: hre.ethers }
                }), safeArgsClaimNodeWine);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const delta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                const msg = `Claimed [ ${delta} WINE ] from NODE-WINE [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log(err);
                taskSummary.push("Failed to claim WINE from NODE-WINE")
            }

        } else {
            const msg = `Skipped claiming WINE from NODE-WINE. Amount of WINE-Nodes: ${balanceState["buckets"]["NODES_WINE"]["amount"]}. WINE Claimable: ${balanceState["buckets"]["NODES_WINE_CLAIMABLE"]["amount"].toFixed(2)}, Minimum threshold: ${EnvUtil.toNumber(FLOW_05_MIN_WINE_CLAIMABLE)}`;
            taskSummary.push(msg);
            console.log(msg);
        }

        // 2.5 claim GRAPE from NODE-GRAPE
        if (balanceState["buckets"]["NODES_GRAPE_CLAIMABLE"]["amount"] > EnvUtil.toNumber(FLOW_05_MIN_GRAPE_CLAIMABLE)) {

            entity = registry.getEntityData(safeNodeGrapeId);
            try {
                const safeArgsClaimNodeGrape = {
                    protocol: safeNodeGrapeId
                };
                console.log("////////////////////////// CLAIM GRAPE FROM NODE-GRAPE");
                const result = await claimExecutor(new ClaimTask({
                    name: "claim",
                    context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                    entity: { ABI: entity.ABI, address: entity.address, name: 'nodes_grape', hre: hre.ethers }
                }), safeArgsClaimNodeGrape);
                const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                const delta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                const msg = `Claimed [ ${delta} GRAPE ] from NODE-GRAPE [tx: ${explorerLink} ]`;
                taskSummary.push(msg)
            } catch (err) {
                console.log(err);
                taskSummary.push("Failed to claim GRAPE from NODE-GRAPE")
            }

        } else {
            const msg = `Skipped claiming GRAPE from NODE-GRAPE. Amount of Grape-Nodes: ${balanceState["buckets"]["NODES_GRAPE"]["amount"]}. GRAPE Claimable: ${balanceState["buckets"]["NODES_GRAPE_CLAIMABLE"]["amount"].toFixed(2)}, Minimum threshold: ${EnvUtil.toNumber(FLOW_05_MIN_GRAPE_CLAIMABLE)}`;
            taskSummary.push(msg);
            console.log(msg);
        }

        balanceState = await getBalances();
        // taskSummary.push(`Checked the balances: ${JSON.stringify(balanceState)}`);


        // 3.1. Check amount of WINE in wallet

        let wineTokenBalance = await wineTokenContract.balanceOf(accountAddress);
        wineTokenBalance = OldMoney.parseAmount(wineTokenBalance);
        console.log("wineTokenBalance:", wineTokenBalance);

        if (wineTokenBalance > safeF4T1E) {
            taskSummary.push(`Checked the WINE balance in Wallet to see that there was enough to continue.`);



            // 3.2. Check amount of GRAPE in wallet

            let grapeTokenBalance = await grapeTokenContract.balanceOf(accountAddress);
            grapeTokenBalance = OldMoney.parseAmount(grapeTokenBalance);
            console.log("grapeTokenBalance:", grapeTokenBalance);

            if (grapeTokenBalance > 50) {
                console.log("////////////////////////// BUYING GRAPE NODE");
                const safeArgsGrapeNode = {
                    protocol: "grapefinance-grapenode",
                    node: "grape",
                    amount: OldMoney.toSafeMoneyWithLimit(50.0)
                };
                entity = registry.getEntityData("grapefinance-grapenode");
                try {
                    const result = await buyNodeExecutor(new BuyNodeTask({
                        name: "buynode",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'nodes_grape', hre: hre.ethers }
                    }), safeArgsGrapeNode);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;

                    const delta = Math.abs(result.delta.buckets["NODES_GRAPE"]["amount"]);
                    const delta2 = Math.abs(result.delta.wallet["GRAPE"]["amount"]);
                    const msg = `Bought [ ${delta} GRAPE NODES for ${delta2} GRAPE ] from NODES [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log("--> error:")
                    console.log(err);
                    taskSummary.push("Failed to buy a GRAPE NODE")
                }


            } else {
                console.log("not enough GRAPE to buy a GRAPE Node (50). Skipping purchase...")
                taskSummary.push("Skipped buying a GRAPE NODE (not enough GRAPE)")
            }

            if (wineTokenBalance > 0.5) {
                console.log("////////////////////////// BUYING WINE NODE");
                const safeArgsWineNode = {
                    protocol: "grapefinance-winenode",
                    node: "wine",
                    amount: OldMoney.toSafeMoneyWithLimit(0.5)
                };
                entity = registry.getEntityData("grapefinance-winenode");
                try {
                    const result = await buyNodeExecutor(new BuyNodeTask({
                        name: "buynode",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'nodes_wine', hre: hre.ethers }
                    }), safeArgsWineNode);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const delta = Math.abs(result.delta.buckets["NODES_WINE"]["amount"]);
                    const delta2 = Math.abs(result.delta.wallet["WINE"]["amount"]);
                    const msg = `Bought [ ${delta} WINE NODES for ${delta2} WINE ] from NODES [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log("--> error:")
                    console.log(err);
                    taskSummary.push("Failed to buy a WINE NODE")
                }

            } else {
                console.log("not enough WINE to buy a WINE Node (0.5). Skipping purchase...")
                taskSummary.push("Skipped buying a WINE NODE (not enough WINE)")
            }





            let amountOfWineToStakeIntoWineGrapeLp = wineTokenBalance * (50.0 / 100);
            let amountOfWineToStakeIntoMimWineLp = wineTokenBalance * (50.0 / 100);
            // const amountOfWineToStakeIntoWinery = wineTokenBalance * (33.33 / 100);
            console.log("amountOfWineToStakeIntoWineGrapeLp:", amountOfWineToStakeIntoWineGrapeLp);
            console.log("amountOfWineToStakeIntoMimWineLp:", amountOfWineToStakeIntoMimWineLp);
            // console.log("amountOfWineToStakeIntoWinery:", amountOfWineToStakeIntoWinery);

            // check price of GRAPE in MIM
            let grapePriceInMim = await traderJoeContract.getAmountsOut(OldMoney.toBigNumber(1, 18), [grapeTokenAddress, mimTokenAddress]);
            grapePriceInMim = OldMoney.parseAmount(grapePriceInMim[1]);
            console.log("grapePriceInMim: ", grapePriceInMim);

            // check price of WINE in MIM
            let winePriceInMim = await traderJoeContract.getAmountsOut(OldMoney.toBigNumber(1, 18), [wineTokenAddress, mimTokenAddress]);
            winePriceInMim = OldMoney.parseAmount(winePriceInMim[1]);
            console.log("winePriceInMim: ", winePriceInMim);

            const wineGrapeRatio = winePriceInMim / grapePriceInMim;
            console.log("wineGrapeRatio:", wineGrapeRatio);

            grapeTokenBalance = await grapeTokenContract.balanceOf(account.address);
            grapeTokenBalance = OldMoney.parseAmount(grapeTokenBalance);
            console.log("grapeTokenBalance:", grapeTokenBalance)

            let amountOfGrapeToBuy = (amountOfWineToStakeIntoWineGrapeLp * wineGrapeRatio) - grapeTokenBalance;
            console.log("amountOfGrapeToBuy:", amountOfGrapeToBuy);

            let amountOfMimToInputIntoWineGrapeLp = amountOfGrapeToBuy * grapePriceInMim;
            console.log("amountOfMimToInputIntoWineGrapeLp:", amountOfMimToInputIntoWineGrapeLp);

            let amountOfMimToInputIntoMimWineLp = winePriceInMim * amountOfWineToStakeIntoMimWineLp;
            console.log("amountOfMimToInputIntoMimWineLp:", amountOfMimToInputIntoMimWineLp);

            const amountOfNecessaryMim = amountOfMimToInputIntoWineGrapeLp + amountOfMimToInputIntoMimWineLp;
            console.log("amountOfNecessaryMim:", amountOfNecessaryMim);

            const amountOfMimToFetch = amountOfNecessaryMim - mimTokenBalance;
            console.log("amountOfMimToFetch:", amountOfMimToFetch);

            let amountOfGrapeMimLPTokensToRemove = 0;

            //const amountOfGrapeExchangeableForMIM = 
            if (amountOfMimToFetch > 0) {

                amountOfGrapeMimLPTokensToRemove = amountOfMimToFetch / grapePriceInMim;
            } else {
                console.log("no more MIM is needed.")
            }

            console.log("amountOfGrapeMimLPTokensToRemove:", amountOfGrapeMimLPTokensToRemove);

            const safeAmountOfGrapeToBuy = OldMoney.toSafeMoneyWithLimit(amountOfGrapeToBuy);
            const safeAmountOfMimToInputIntoWineGrapeLp = OldMoney.toSafeMoneyWithLimit(amountOfMimToInputIntoWineGrapeLp);
            const safeAmountOfWineToStakeIntoWineGrapeLp = OldMoney.toSafeMoneyWithLimit(amountOfWineToStakeIntoWineGrapeLp);

            const safeAmountOfMimToInputIntoMimWineLp = OldMoney.toSafeMoneyWithLimit(amountOfMimToInputIntoMimWineLp);
            const safeAmountOfWineToStakeIntoMimWineLp = OldMoney.toSafeMoneyWithLimit(amountOfWineToStakeIntoMimWineLp);
            const safeAmountOfGrapeMimLPTokensToRemove = OldMoney.toSafeMoneyWithLimit(amountOfGrapeMimLPTokensToRemove);

            // console.log('balanceState["VINEYARD_GRAPE_MIM_LP_STAKED"]["amount":')
            // console.log(balanceState["VINEYARD_GRAPE_MIM_LP_STAKED"]["amount"])

            if (amountOfGrapeMimLPTokensToRemove < balanceState["buckets"]["VINEYARD_GRAPE_MIM_LP_STAKED"]["amount"]) {
                if (amountOfGrapeMimLPTokensToRemove > 0) {

                    const account: SignerWithAddress = await getAccount();

                    // withdraw liquidity from GRAPE-MIM-LP at the Vineyard

                    let safeArgsW = {
                        protocol: safeVineyardId,
                        pool: safeGrapeMIMPoolId,
                        amount: OldMoney.toBigNumber(amountOfGrapeMimLPTokensToRemove, 18)
                    };
                    let entity = registry.getEntityData(safeVineyardId);
                    console.log("////////////////////////// WITHDRAW LIQUIDITY FROM GRAPE-MIM-LP AT VINEYARD");
                    try {
                        const result = await poolclaimExecutor(new PoolClaimTask({
                            name: "poolclaim",
                            context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                            entity: { ABI: entity.ABI, address: entity.address, name: 'grape_mim_lp', hre: hre.ethers }
                        }), safeArgsW);
                        const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                        const delta = Math.abs(result.delta.wallet["GRAPE_MIM_LP"]["amount"].toFixed(6));
                        const msg = `Withdraw [ ${delta} GRAPE-MIM-LP ] from GRAPE-MIM-LP at the Vineyard [tx: ${explorerLink} ]`;
                        taskSummary.push(msg)
                    } catch (err) {
                        console.log(err);
                        taskSummary.push("Failed to withdraw liquidity from GRAPE-MIM-LP at the Vineyard")
                    }

                    console.log("////////////////////////// REMOVE LIQUIDITY FROM GRAPE-MIM-LP AT TRADERJOE");
                    const safeProtocolId = registry.findProtocol("traderjoe").id;
                    const safeAmount = safeAmountOfGrapeMimLPTokensToRemove;
                    const safeToken1Address = registry.findToken("grape").address;
                    const safeToken2Address = registry.findToken("mim").address;
                    const safeLiquidityPair = registry.findToken("grape-mim-lp").id;
                    const safeArgs = {
                        protocol: safeProtocolId,
                        token1Address: safeToken1Address,
                        token2Address: safeToken2Address,
                        liquidityPair: safeLiquidityPair,
                        amount: safeAmount
                    };
                    entity = registry.getEntityData(safeProtocolId);
                    ///////////////////////////////////////////////////////////////////

                    try {
                        const result = await removeLiquidityExecutor(new RemoveLiquidityTask({
                            name: "removeliquidity",
                            context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                            entity: { ABI: entity.ABI, address: entity.address, name: 'grape_mim_lp', hre: hre.ethers }
                        }), safeArgs);
                        const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                        const grapeMimDelta = Math.abs(result.delta.wallet["GRAPE_MIM_LP"]["amount"].toFixed(6));
                        const grapeDelta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                        const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                        const msg = `Removed [ ${grapeMimDelta} GRAPE-MIM-LP ] for [${grapeDelta} GRAPE] and [${mimDelta} MIM] from Trader Joe [tx: ${explorerLink} ]`;
                        taskSummary.push(msg)
                        // taskSummary.push("Removed Liquidity from GRAPE-MIM-LP")
                    } catch (err) {
                        console.log("--> error:")
                        console.log(err);
                        taskSummary.push("Failed to Remove Liquidity from GRAPE-MIM-LP")
                    }

                } else {
                    console.log("No need to remove GRAPE-MIM-LP tokens from the Vineyard. There is enough MIM available.");
                    taskSummary.push("Skipped removing liquidity from GRAPE-MIM-LP (there was enough MIM available)");
                }

                mimTokenBalance = await mimTokenContract.balanceOf(accountAddress);
                mimTokenBalance = OldMoney.parseAmount(mimTokenBalance);
                console.log("new mimTokenBalance:", mimTokenBalance);
                balance["mim"] = mimTokenBalance;

                const safeArgsB = {
                    protocol: safeTraderJoeId,
                    tokenInAddress: mimTokenAddress,
                    tokenOutAddress: grapeTokenAddress,
                    amount: safeAmountOfMimToInputIntoWineGrapeLp
                };

                if (amountOfGrapeToBuy > 0) {
                    console.log("//////////////////////////SWAP MIM FOR GRAPE AT TRADERJOE");
                    try {
                        const result = await swapTokensExecutor(
                            new SwapTokensTask({
                                name: "swaptokens",
                                context: {
                                    address: account.address,
                                    provider: hre.ethers.provider,
                                    chain: chain,
                                    run: EnvUtil.toNumber(FLOW_05_RUN_ID)
                                }, entity: { ABI: entity.ABI, address: entity.address, name: 'trade', hre: hre.ethers }
                            }),
                            safeArgsB);
                        const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                        const grapeDelta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                        const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                        const msg = `Swapped [ ${mimDelta} MIM ] for [ ${grapeDelta} GRAPE] at Trader Joe [tx: ${explorerLink} ]`;
                        taskSummary.push(msg)
                    } catch (err) {
                        console.log("--> error:")
                        console.log(err);
                        taskSummary.push("Failed to swap MIM for GRAPE at Trader Joe")
                    }
                } else {
                    taskSummary.push("Skipped swapping MIM for GRAPE since there was enough GRAPE available already")
                }

                // Add Liquidity to Grape Wine LP at TraderJoe
                const safeArgsC = {
                    protocol: safeTraderJoeId,
                    token1Address: grapeTokenAddress,
                    token2Address: wineTokenAddress,
                    amount1: safeAmountOfGrapeToBuy,
                    amount2: safeAmountOfWineToStakeIntoWineGrapeLp
                };
                if (amountOfMimToInputIntoWineGrapeLp > 0 && amountOfWineToStakeIntoWineGrapeLp) {
                    console.log("//////////////////////////ADD LIQUIDITY TO GRAPE-WINE-LP AT TRADERJOE ");
                    try {
                        const result = await addLiquidityExecutor(
                            new AddLiquidityTask({
                                name: "addliquidity",
                                context: {
                                    address: account.address,
                                    provider: hre.ethers.provider,
                                    chain: chain,
                                    run: EnvUtil.toNumber(FLOW_05_RUN_ID)
                                }, entity: { ABI: entity.ABI, address: entity.address, name: 'grape_wine_lp', hre: hre.ethers }
                            }),
                            safeArgsC);
                        const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                        const grapeDelta = Math.abs(result.delta.wallet["GRAPE"]["amount"].toFixed(6));
                        const wineDelta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                        const msg = `Added [ ${grapeDelta} GRAPE ] and [ ${wineDelta} WINE] to GRAPE-WINE-LP at Trader Joe [tx: ${explorerLink} ]`;
                        taskSummary.push(msg)
                    } catch (err) {
                        console.log("--> error:")
                        console.log(err);
                        taskSummary.push("Failed to Add Liquidity to GRAPE-WINE-LP at Trader Joe")
                    }
                } else {
                    taskSummary.push("Skipped adding Liquidity to GRAPE-WINE-LP")
                }

                // Get Balance of Grape-Wine-LP tokens in wallet
                let grapeWineLPTokenBalance = await grapeWineLPTokenContract.balanceOf(accountAddress);
                grapeWineLPTokenBalance = OldMoney.parseAmount(grapeWineLPTokenBalance);
                console.log("grapeWineLPTokenBalance :", grapeWineLPTokenBalance);

                const amountOfLPToDeposit = OldMoney.toSafeMoneyWithLimit(grapeWineLPTokenBalance * 0.9995);

                // Add WINE-GRAPE-LP-token to Grape
                const safeLiquidityPairId = registry.findToken("grape-wine-lp").id;
                const safeArgsD = {
                    protocol: safeVineyardId,
                    amount: amountOfLPToDeposit,
                    liquidityPair: safeLiquidityPairId
                };
                entity = registry.getEntityData(safeVineyardId);
                if (grapeWineLPTokenBalance > 0) {
                    console.log("//////////////////////////DEPOSIT GRAPE-WINE-LP TOKEN AT GRAPE-FINANCE'S VINEYARD");
                    try {
                        const result = await depositExecutor(
                            new DepositTask({
                                name: "deposit",
                                context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                                entity: { ABI: entity.ABI, address: entity.address, name: 'grape_wine_lp', hre: hre.ethers }
                            }), safeArgsD);
                        const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                        const delta = Math.abs(result.delta.wallet["GRAPE_WINE_LP"]["amount"].toFixed(6));
                        const msg = `Deposited [ ${delta} GRAPE-WINE-LP ] at the Vineyard [tx: ${explorerLink} ]`;
                        taskSummary.push(msg)
                    } catch (err) {
                        console.log("--> error:")
                        console.log(err);
                        taskSummary.push("Failed to deposit GRAPE-WINE-LP Tokens at the Vineyard")
                    }
                } else {
                    taskSummary.push("Skipped depositing GRAPE-WINE-LP Tokens at the Vineyard (no LP tokens in wallet)")
                }

                // Add Liquidity to MIM Wine LP at TraderJoe
                const safeArgsE = {
                    protocol: safeTraderJoeId,
                    token1Address: mimTokenAddress,
                    token2Address: wineTokenAddress,
                    amount1: safeAmountOfMimToInputIntoMimWineLp,
                    amount2: safeAmountOfWineToStakeIntoMimWineLp
                };
                console.log("//////////////////////////ADD LIQUIDITY TO MIM-WINE-LP AT TRADERJOE");
                try {
                    const result = await addLiquidityExecutor(new AddLiquidityTask({
                        name: "addliquidity",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'mim_wine_lp', hre: hre.ethers }
                    }), safeArgsE);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const mimDelta = Math.abs(result.delta.wallet["MIM"]["amount"].toFixed(6));
                    const wineDelta = Math.abs(result.delta.wallet["WINE"]["amount"].toFixed(6));
                    const msg = `Added [ ${mimDelta} MIM ] and [ ${wineDelta} WINE] to MIM-WINE-LP at Trader Joe [tx: ${explorerLink} ]`;
                    taskSummary.push(msg)
                } catch (err) {
                    console.log("--> error:")
                    console.log(err);
                    taskSummary.push("Failed to add liquidity to MIM-WINE-LP at Trader Joe")
                }

                // Get Balance of Grape-Wine-LP tokens in wallet
                let mimWineLPTokenBalance = await mimWineLPTokenContract.balanceOf(accountAddress);
                mimWineLPTokenBalance = OldMoney.parseAmount(mimWineLPTokenBalance);
                console.log("mimWineLPTokenBalance :", mimWineLPTokenBalance);

                const amountOfMimWineLPToDeposit = OldMoney.toSafeMoneyWithLimit(mimWineLPTokenBalance * 0.9995);

                // Add MIM-WINE-LP-token to Grape
                const safeMimWineLiquidityPairId = registry.findToken("mim-wine-lp").id;
                const safeArgsF = {
                    protocol: safeVineyardId,
                    amount: amountOfMimWineLPToDeposit,
                    liquidityPair: safeMimWineLiquidityPairId
                };
                entity = registry.getEntityData(safeVineyardId);
                console.log("////////////////////////// DEPOSIT MIM-WINE-LP TOKEN AT GRAPE-FINANCE'S VINEYARD");
                try {
                    const result = await depositExecutor(new DepositTask({
                        name: "deposit",
                        context: { address: account.address, provider: hre.ethers.provider, chain: chain, run: EnvUtil.toNumber(FLOW_05_RUN_ID) },
                        entity: { ABI: entity.ABI, address: entity.address, name: 'mim_wine_lp', hre: hre.ethers }
                    }), safeArgsF);
                    const explorerLink = "https://snowtrace.io/tx/" + result.receipt.transactionHash;
                    const delta = Math.abs(result.delta.wallet["MIM_WINE_LP"]["amount"].toFixed(6));
                    const msg = `Deposited [ ${delta} MIM-WINE-LP ] at the Vineyard [tx: ${explorerLink} ]`;
                    taskSummary.push(msg);
                } catch (err) {
                    console.log("--> error:")
                    console.log(err);
                    taskSummary.push("Failed to deposit MIM-WINE-LP Tokens at the Vineyard")
                }


                /*const safeProtocolId = registry.findProtocol("grapefinance-winery").id;
                const safeAmount = OldMoney.toSafeMoneyWithLimit(amountOfWineToStakeIntoWinery);
                const safeArgsG = {
                    protocol: safeProtocolId, amount: safeAmount
                };
                ///////////////////////////////////////////////////////////////////
                entity = registry.getEntityData(safeProtocolId);
                console.log("////////////////////////// STAKE WINE AT THE WINERY");
                await stakeExecutor(new StakeTask({
                    name: "stake",
                    context: { address: account.address, provider: hre.ethers.provider },
                    entity: { ABI: entity.ABI, address: entity.address, hre: hre.ethers }
                }), safeArgsG);
                */
            } else {
                taskSummary.push(`Stopped the execution here. The required amount of GRAPE-MIM-LP to withdraw from the Vineyard (${amountOfGrapeMimLPTokensToRemove.toFixed(2)}) is higher than what there is currently staked (${balanceState["buckets"]["VINEYARD_GRAPE_MIM_LP_STAKED"]["amount"]}). We need an additional: $MIM ${Math.abs(amountOfMimToFetch).toFixed(2)} and $GRAPE ${Math.abs(amountOfGrapeToBuy).toFixed(2)} to be able to match the $WINE and stake into the GRAPE-WINE-LP and MIM-WINE-LP`);
                console.log(`Stopped the execution here. The required amount of GRAPE-MIM-LP to withdraw from the Vineyard (${amountOfGrapeMimLPTokensToRemove.toFixed(2)}) is higher than what there is currently staked (${balanceState["buckets"]["VINEYARD_GRAPE_MIM_LP_STAKED"]["amount"]}). We need an additional: $MIM ${Math.abs(amountOfMimToFetch).toFixed(2)} and $GRAPE ${Math.abs(amountOfGrapeToBuy).toFixed(2)} to be able to match the $WINE and stake into the GRAPE-WINE-LP and MIM-WINE-LP`);
            }
        } else {
            taskSummary.push(`Stopped the execution, there is not enough WINE in wallet to continue. $WINE required: ${safeF4T1E}, available: ${wineTokenBalance}`);
            console.log(`Stopped the execution, there is not enough WINE in wallet to continue. $WINE required: ${safeF4T1E}, available: ${wineTokenBalance}`);
        }

        balanceState = await getBalances();
        const balancePost = balanceState;

        console.log('balancePre:', balancePre);
        console.log('balancePost:', balancePre);

        const flowDelta = await getDelta(balancePre, balancePost);
        console.log('delta:', flowDelta);

        // update RUN ID
        const currentRunId = EnvUtil.toNumber(FLOW_05_RUN_ID);
        const newRunId = (currentRunId + 1).toString();
        // console.log('currentRunId:', currentRunId);
        // console.log('newRunId:', newRunId);
        // EnvUtil.setEnvValue(envFilePath, FLOW_05_RUN_ID, newRunId)

        // taskSummary.push(`Checked the final balances: ${JSON.stringify(balanceState)}`);
        console.log("////////////////////////////////////////////////////////////")
        console.log("Flow execution summary:")
        let c = 0;
        for (let t of taskSummary) {
            c = c + 1;
            console.log(`${c.toString()}. ${t}`);
        }

    });
