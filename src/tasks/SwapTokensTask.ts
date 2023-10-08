import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber, ethers } from "ethers";
import { getBalances } from "../../tasks/tasks";
import {OldMoney} from "../classes/OldMoney";

export interface SwapTokensTaskArgs {
    protocol: string,
    amount: BigNumber;
    tokenInAddress: string;
    tokenOutAddress: string;
}

export class SwapTokensTask extends Task<SwapTokensTaskArgs>{

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: SwapTokensTaskArgs): Promise<any> {

        const contract = await this.entity.getContract();
        const registry = new TaskRegistry();
        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;

        const functionName = registry.findProtocol(safeArgs.protocol).tasks["swaptokens"];
        console.log("functionName:", functionName);

        const fn = contract[functionName];
        const tokenInAddress = safeArgs.tokenInAddress;
        const tokenOutAddress = safeArgs.tokenOutAddress;

        const tokenIn = tokenInAddress;
        const tokenOut = tokenOutAddress;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const walletAddress = this.context.address;
        const amountOutMin = 0; // Degen ape don't give a f about slippage;

        const amountApprove = BigNumber.from(safeArgs.amount).mul(BigNumber.from("1000"));
        const amount = BigNumber.from(safeArgs.amount);
        // console.log("amount: ");
        // console.log(amount);

        const traderJoeABI = registry.findProtocol("traderjoe").ABI
        const traderJoeAddress = registry.findProtocol("traderjoe").address
        const traderJoeContract = await this.entity.hre.getContractAt(traderJoeABI, traderJoeAddress);

        
        const tokenInObj = registry.findTokenByAddress(safeArgs.tokenInAddress);
        const tokenInId = tokenInObj.id;
        const tokenInABI = tokenInObj.ABI;
        const tokenInContract = await this.entity.hre.getContractAt(tokenInABI, tokenInAddress);

        const balanceBefore = await getBalances();

        // console.log(`balanceBefore[${tokenin_obj.id.toUpperCase()}]["amount"]:`,balanceBefore[tokenin_obj.id.toUpperCase()]["amount"]);
        // console.log('Money.parseAmount(amount):',Money.parseAmount(amount));

        let logInfo = {
            label: `approve ${safeArgs.protocol}.${functionName}`,
            protocol: protocolId,
            chainId: chainId, 
            nativeToken: nativeToken,
            run: this.context.run,
            action: functionName,
            step: 'approve',
            amount: OldMoney.parseAmount(safeArgs.amount),
            asset:tokenInObj.id,
            tx: ''
        }


        logInfo.label = `approve ${safeArgs.protocol}.${functionName}`;

        if(balanceBefore["wallet"][tokenInObj.id.toUpperCase()]["amount"] > OldMoney.parseAmount(amount)){

            const approveIn = await execTx(tokenInContract.approve(traderJoeAddress, amountApprove), {
                logInfo: logInfo,
                log: false,
                ledger: true
            }, balanceBefore);
            // console.log("approveIn:", approveIn);
    
            const tokenout_obj = registry.findTokenByAddress(safeArgs.tokenOutAddress);
            const tokenout_id = tokenout_obj.id;
            const tokenout_address = tokenout_obj.address;
    
            const args = [amount, amountOutMin, [tokenIn, tokenOut], walletAddress, deadline];
    
            console.log("args: ", args);
    
            // const result = await fn.apply(null, args);

            logInfo.label = `${safeArgs.protocol}.${functionName}[tokenInAmount ${amount}][tokenIn ${tokenInId}][tokenOut ${tokenout_id}]`;
            logInfo.step = 'invoke';
    
            const result = await execTx(traderJoeContract.swapExactTokensForTokens(amount, 0, [tokenInAddress, tokenout_address], walletAddress, deadline), {
                logInfo: logInfo,
                log: true,
                ledger: true
            }, balanceBefore);
    
            return result;
        }else{

            throw `Custom error: Hey, there's not enough funds. Available: ${tokenInObj.id.toUpperCase()} ${balanceBefore["wallet"][tokenInObj.id.toUpperCase()]["amount"]}, requested: ${tokenInObj.id.toUpperCase()} ${OldMoney.parseAmount(amount)}`
        }
        
    }
}