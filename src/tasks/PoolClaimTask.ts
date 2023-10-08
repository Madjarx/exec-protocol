import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

export interface PoolClaimTaskArgs {
    protocol: string,
    pool: string,
    amount: BigNumber;
}

export class PoolClaimTask extends Task<PoolClaimTaskArgs> {

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: PoolClaimTaskArgs): Promise<any> {

        const contract = await this.entity.getContract();
        const registry = new TaskRegistry();

        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;
        
        const functionName = registry.findProtocol(safeArgs.protocol).tasks["poolclaim"];
        console.log("functionName:", functionName);
        // const fn = contract[functionName];

        const poolObject = registry.findPool(safeArgs.pool);
        const poolName = poolObject.id;
        const pid = poolObject.pid;
        
        const balanceBefore = await getBalances();

        let logInfo = {
            label: `${safeArgs.protocol}.${functionName}[pid ${pid}-${poolName}]`,
            protocol: protocolId,
            chainId: chainId, 
            nativeToken: nativeToken,
            run: this.context.run,
            action: functionName,
            step: 'invoke',
            amount: OldMoney.parseAmount(safeArgs.amount),
            asset: protocol.yieldAssets[0],
            tx: ''
        }

        const result = await execTx(await contract.withdraw(pid, safeArgs.amount), {
            logInfo: logInfo,
            log: true,
            ledger: true
        }, balanceBefore);

        return result;
    }
}
