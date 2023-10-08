import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

export interface RemoveLiquidityTaskArgs {
    protocol: string,
    amount: BigNumber;
    token1Address: string;
    token2Address: string;
    liquidityPair: string;
}
export class RemoveLiquidityTask extends Task<RemoveLiquidityTaskArgs> {

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: RemoveLiquidityTaskArgs): Promise<any> {
        const contract = await this.entity.getContract();
        const registry = new TaskRegistry();
        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;

        const functionName = registry.findProtocol(safeArgs.protocol).tasks["removeLiquidity"];
        // console.log("functionName:", functionName);

        const fn = contract[functionName];

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const walletAddress = this.context.address;
        const amountOutMin = 0;
        const amount = safeArgs.amount;
        // console.log("amount: ", amount);

        const amount1Min = 0;
        const amount2Min = 0;

        const token1_address = safeArgs.token1Address;
        const token2_address = safeArgs.token2Address;

        const traderJoeABI = registry.findProtocol("traderjoe").ABI
        const traderJoeAddress = registry.findProtocol("traderjoe").address
        const traderJoeContract = await this.entity.hre.getContractAt(traderJoeABI, traderJoeAddress);

        // console.log("traderJoeContract:", traderJoeContract);
        // console.log("safeArgs.liquidityPair: ", safeArgs.liquidityPair);

        const lp = registry.findToken(safeArgs.liquidityPair);
        const pairContract = await this.entity.hre.getContractAt(lp.ABI, lp.address);
        // console.log("pairContract: ", pairContract);

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
            asset: protocol.yieldAssets[0],
            tx: ''
        }

        const approve = await execTx(pairContract.approve(traderJoeAddress, amount), {
            logInfo: logInfo,
            log: false,
            ledger: true
        }, balanceBefore);
        // console.log("approve:", approve);

        logInfo.label = `${safeArgs.protocol}.${functionName}[LP ${lp.id}]`;
        const result = await execTx(traderJoeContract.removeLiquidity(token1_address, token2_address, amount, amount1Min, amount2Min, walletAddress, deadline), {
            logInfo: logInfo,
            log: true,
            ledger: true
        }, balanceBefore);

        return result;
    }
}