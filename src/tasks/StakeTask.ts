import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

export interface StakeTaskArgs {
    protocol: string,
    token: string,
    amount: BigNumber;
}

export class StakeTask extends Task<StakeTaskArgs> {

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    // public override async execute(safeArgs: { protocol: string, amount: number; }) {
    public async execute(safeArgs: StakeTaskArgs): Promise<Object> {

        const registry = new TaskRegistry();
        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;

        const balanceBefore = await getBalances();

        // console.log(`balanceBefore[${tokenin_obj.id.toUpperCase()}]["amount"]:`,balanceBefore[tokenin_obj.id.toUpperCase()]["amount"]);
        // console.log('Money.parseAmount(amount):',Money.parseAmount(amount));

        const tokenId = registry.findToken(safeArgs.token).id;

        if (balanceBefore["wallet"][tokenId.toUpperCase()]["amount"] > OldMoney.parseAmount(safeArgs.amount)) {

            const functionName = registry.findProtocol(safeArgs.protocol).tasks["stake"];
            console.log("functionName:", functionName);


            const contractAddress = registry.findProtocol(safeArgs.protocol).address;
            const contractABI = registry.findProtocol(safeArgs.protocol).ABI;
            const contract = await this.entity.hre.getContractAt(contractABI, contractAddress);

            // console.log("contractAddress:", contractAddress);
            // console.log("contract:", contract);

            const tokenObject = registry.findToken(safeArgs.token);
            const tokenAddress = tokenObject.address;
            const tokenABI = registry.findToken(safeArgs.token).ABI;
            const tokenContract = await this.entity.hre.getContractAt(tokenABI, tokenAddress);

            const balanceBefore = await getBalances();
            const amount = safeArgs.amount;
            // const theAmount = this.entity.hre.BigNumber.from(safeArgs.amount);

            let logInfo = {
                label: `approve ${safeArgs.protocol}.${functionName}`,
                protocol: protocolId,
                chainId: chainId, 
                nativeToken: nativeToken,
                run: this.context.run,
                action: functionName,
                step: 'approve',
                amount: OldMoney.parseAmount(safeArgs.amount),
                asset:tokenObject.id,
                tx: ''
            }
    



            const approve1 = await execTx(tokenContract.approve(contractAddress, safeArgs.amount), {
                logInfo: logInfo,
                log: false,
                ledger: true
            }, balanceBefore);

            console.log("approve1:");
            console.log(approve1);

            let poolId = 0;

            let result:any;

            logInfo = {
                label: `${safeArgs.protocol}.${functionName}`,
                protocol: protocolId,
                chainId: chainId, 
                nativeToken: nativeToken,
                run: this.context.run,
                action: functionName,
                step: 'invoke',
                amount: OldMoney.parseAmount(safeArgs.amount),
                asset:tokenObject.id,
                tx: ''
            }

            if(safeArgs.protocol === 'grapefinance-vineyard'){
                poolId = 3;

                logInfo.label = `${safeArgs.protocol}.${functionName}`;

                result = await execTx(await contract.deposit(3, safeArgs.amount), {
                    logInfo: logInfo,
                    log: true,
                    ledger: true
                }, balanceBefore);

            }else if(safeArgs.protocol === 'grapefinance-winery'){
                
                logInfo.label = `${safeArgs.protocol}.${functionName}[tokenInAmount ${amount}]`;
                result = await execTx(await contract.stake(safeArgs.amount), {
                    logInfo: logInfo,
                    log: true,
                    ledger: true
                }, balanceBefore);
            }




            

            return result;
        } else {

            throw `Custom error: Hey, there's not enough funds. Available: ${tokenId.toUpperCase()} ${balanceBefore["wallet"][tokenId.toUpperCase()]["amount"]}, requested: ${tokenId.toUpperCase()} ${OldMoney.parseAmount(safeArgs.amount)}`
        }
    }
}

