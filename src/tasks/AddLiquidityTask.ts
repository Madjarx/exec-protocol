import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

export interface AddLiquidityTaskArgs {
    protocol: string,
    amount1: BigNumber;
    amount2: BigNumber;
    token1Address: string;
    token2Address: string;
}

export class AddLiquidityTask extends Task<AddLiquidityTaskArgs> {


    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: AddLiquidityTaskArgs): Promise<any> {

        const contract = await this.entity.getContract();
        const registry = new TaskRegistry();

        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;

        const functionName = protocol.tasks["addliquidity"];
        console.log("functionName:", functionName);

        const fn = contract[functionName];

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const walletAddress = this.context.address;
        const amount1 = safeArgs.amount1;
        console.log("amount1: ");
        console.log(amount1);

        const amount2 = safeArgs.amount2;
        console.log("amount2: ");
        console.log(amount2);

        const amount1Min = 0;
        const amount2Min = 0;

        const traderJoeABI = registry.findProtocol("traderjoe").ABI
        const traderJoeAddress = registry.findProtocol("traderjoe").address
        const traderJoeContract = await this.entity.hre.getContractAt(traderJoeABI, traderJoeAddress);

        const token1_obj = registry.findTokenByAddress(safeArgs.token1Address);
        const token1_address = token1_obj.address;
        const token1_ABI = token1_obj.ABI;
        const token1Id = token1_obj.id;
        const token1Contract = await this.entity.hre.getContractAt(token1_ABI, token1_address);

        const token2_obj = registry.findTokenByAddress(safeArgs.token2Address);
        const token2_address = token2_obj.address;
        const token2_ABI = token1_obj.ABI;
        const token2Id = token2_obj.id;
        const token2Contract = await this.entity.hre.getContractAt(token1_ABI, token2_address);

        const balanceBefore = await getBalances();

        let logInfo = {
            label: `${protocolId}.${functionName}`,
            protocol: protocolId,
            chainId: chainId, 
            nativeToken: nativeToken,
            run: this.context.run,
            action: functionName,
            step: 'invoke',
            amount: OldMoney.parseAmount(safeArgs.amount1),
            asset: token1Id + "-" + token2Id + "-LP",
            tx: ''
        }

        const approve1 = await execTx(token1Contract.approve(traderJoeAddress, safeArgs.amount1), {
            logInfo: logInfo,
            log: false,
            ledger: true
        }, balanceBefore);
        // console.log("approve1:", approve1);

        const approve2 = await execTx(token2Contract.approve(traderJoeAddress, safeArgs.amount2), {
            logInfo: logInfo,
            log: false,
            ledger: true
        }, balanceBefore);
        // console.log("approve2:", approve2);

        logInfo.label = `${safeArgs.protocol}.${functionName}[token1 ${token1Id}][token2 ${token2Id}][amount1 ${amount1}][amount2 ${amount2}]`;
        const result = await execTx(traderJoeContract.addLiquidity(token1_address, token2_address, amount1, amount2, amount1Min, amount2Min, walletAddress, deadline), {
            logInfo: logInfo,
            log: true,
            ledger: true
        }, balanceBefore);

        return result;
    }
}
