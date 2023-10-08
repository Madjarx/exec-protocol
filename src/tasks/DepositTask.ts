import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

export interface DepositTaskArgs {
    protocol: string,
    amount: BigNumber;
    liquidityPair: string;
}

export class DepositTask extends Task<DepositTaskArgs> {

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: DepositTaskArgs): Promise<any> {

        const contract = await this.entity.getContract();

        const registry = new TaskRegistry();

        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;

        const functionName = registry.findProtocol(safeArgs.protocol).tasks["stake"];
        console.log("functionName:", functionName);

        const poolAddress = registry.findProtocol(safeArgs.protocol).address;
        console.log("poolAddres: ");
        console.log(poolAddress);

        const lpToken = registry.findToken(safeArgs.liquidityPair);
        const lpTokenAddress = lpToken.address;
        const lpTokenAbi = lpToken.ABI;
        const lpContract = await this.entity.hre.getContractAt(lpTokenAbi, lpTokenAddress);

        const amount = safeArgs.amount;
        const balanceBefore = await getBalances();

        let logInfo = {
            label: `approve ${safeArgs.protocol}.${functionName}`,
            protocol: protocolId,
            chainId: chainId, 
            nativeToken: nativeToken,
            run: this.context.run,
            action: functionName,
            step: 'invoke',
            amount: OldMoney.parseAmount(safeArgs.amount),
            asset: lpToken.asset,
            tx: ''
        }


        const approve = await execTx(lpContract.approve(poolAddress, amount), {
            logInfo: logInfo,
            log: false,
            ledger: true
        }, balanceBefore);


        console.log("approve:");
        console.log(approve);

        // const fn = contract[functionName];

        const args = [poolAddress, safeArgs.amount];

        console.log("args: ");
        console.log(args);

        let poolId = 0;
        if (safeArgs.liquidityPair === "grape-mim-lp") {
            poolId = 0;
        } else if (safeArgs.liquidityPair === "mim-wine-lp") {
            poolId = 1;
        } else if (safeArgs.liquidityPair === "grape-wine-lp") {
            poolId = 2;
        } else {
            throw new Error("need to know and set the poolId for this liquidity Pair");
        }

        logInfo.label = `${safeArgs.protocol}.${functionName}[LP ${safeArgs.liquidityPair}]`;
        const result = await execTx(await contract.deposit(poolId, safeArgs.amount), {
            logInfo: logInfo,
            log: true,
            ledger: true
        }, balanceBefore);

        return result;
    }
}