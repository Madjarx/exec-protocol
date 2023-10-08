import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

interface SwapNativeTaskArgs {
    protocol: string,
    amount: BigNumber;
    tokenInAddress: string;
    tokenOutAddress: string;
}

export class SwapNativeTask extends Task<SwapNativeTaskArgs> {

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: SwapNativeTaskArgs): Promise<any> {

        const contract = await this.entity.getContract();
        const registry = new TaskRegistry();
        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;
        
        const functionName = new TaskRegistry().findProtocol(safeArgs.protocol).tasks["swapnative"];
        console.log("functionName:", functionName);

        const fn = contract[functionName];
        const tokenInObj = registry.findTokenByAddress(safeArgs.tokenInAddress);
        const tokenInId = tokenInObj.id;
        const tokenInAddress = safeArgs.tokenInAddress;

        const tokenOutObj = registry.findTokenByAddress(safeArgs.tokenOutAddress);
        const tokenOutId = tokenOutObj.id;
        const tokenOutAddress = safeArgs.tokenOutAddress;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const walletAddress = this.context.address;
        const amountOutMin = 0; // Degen ape don't give a f about slippage;
        const amount = safeArgs.amount;

        let logInfo = {
            label: `${safeArgs.protocol}.${functionName}`,
            protocol: protocolId,
            chainId: chainId, 
            nativeToken: nativeToken,
            run: this.context.run,
            action: functionName,
            step: 'approve',
            amount: OldMoney.parseAmount(safeArgs.amount),
            asset:tokenInId,
            tx: ''
        }



        const args = [amountOutMin, [tokenInAddress, tokenOutAddress], walletAddress, deadline, {
            // ...gas,
            value: amount
        }];

        logInfo.label = `${safeArgs.protocol}.${functionName}[tokenInAmount ${amount}][tokenIn ${tokenInId}][tokenOut ${tokenOutId}]`;

        const balanceBefore = await getBalances();
        const result = await execTx(fn.apply(null, args), {
            logInfo: logInfo,
            log: true,
            ledger: true
        }, balanceBefore);

        return result;
    }
}