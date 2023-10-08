import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

export interface WithdrawTaskArgs {
    protocol: string,
    amount: BigNumber;
}

export class WithdrawTask extends Task<WithdrawTaskArgs>{

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: WithdrawTaskArgs): Promise<any> {

        const contract = await this.entity.getContract();
        const registry = new TaskRegistry();

        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;

        const functionName = registry.findProtocol(safeArgs.protocol).tasks["withdraw"];
        console.log("functionName:", functionName);

        const fn = contract[functionName];
        const args = [safeArgs.amount];

        let logInfo = {
            label: `${safeArgs.protocol}.${functionName}[amount ${safeArgs.amount}]`,
            protocol: protocolId,
            chainId: chainId, 
            nativeToken: nativeToken,
            run: this.context.run,
            action: functionName,
            step: 'invoke',
            amount: OldMoney.parseAmount(safeArgs.amount),
            asset: protocol.depositAssets[0],
            tx: ''
        }
        
        const balanceBefore = await getBalances();
        const result = await execTx(fn.apply(null, args), {
            logInfo: logInfo,
            log: true,
            ledger: true
        }, balanceBefore);

        return result;
    }
}