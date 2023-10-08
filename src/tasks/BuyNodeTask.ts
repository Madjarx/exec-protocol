import { EntityRef } from "../classes/Entity";
import { ContextRef } from "../classes/Context";
import { Task } from "./Task";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { execTx } from "../../tasks/tasks";
import { TaskRegistry } from "../classes/Registry";
import { BigNumber } from "ethers";
import { getBalances } from "../../tasks/tasks";
import { OldMoney } from "../../src/classes/OldMoney";

export interface BuyNodeTaskArgs {
    protocol: string,
    node: string,
    amount: BigNumber;
}
export class BuyNodeTask extends Task<BuyNodeTaskArgs> {

    constructor(obj: { name: string, context: ContextRef, entity: EntityRef; }) {
        super({ name: obj.name, context: obj.context, entity: obj.entity });
    }

    public async execute(safeArgs: BuyNodeTaskArgs): Promise<any> {

        const contract = await this.entity.getContract();
        const registry = new TaskRegistry();

        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        const protocol = registry.findProtocol(safeArgs.protocol);
        const protocolId = protocol.id;

        const functionName = protocol.tasks["buynode"];
        console.log("functionName:", functionName);

        const node = registry.findNode(safeArgs.node);

        const nodeTokenContractAddress = node.token_contract_address;
        const nodeContractAddress = node.node_contract_address;
        const nodeABI = node.ABI;
        const nodeTokenABI = node.TOKEN_ABI;
        const nodeTokenContract = await this.entity.hre.getContractAt(nodeTokenABI, nodeTokenContractAddress);


        //const grapetoken_contract_address = "0x5541D83EFaD1f281571B343977648B75d95cdAC2";
        //const grapeTokenContract = await this.entity.hre.getContractAt(GRAPE_ABI, grapetoken_contract_address);

        //const grapenode_contract_address = "0x4cde1deb1fd11fec61b6e2d322c1520527992196";
        //const grapeNodeContract = await this.entity.hre.getContractAt(GRAPEFINANCENODE_ABI, grapenode_contract_address);

        // const theAmount = this.entity.hre.BigNumber.from("99999999");
        console.log("nodeTokenContractAddress:", nodeTokenContractAddress);
        console.log("nodeContractAddress:", nodeContractAddress);
        const balanceBefore = await getBalances();

        let logInfo = {
            label: 'nodeContract.approve',
            protocol: protocolId,
            chainId: chainId, 
            nativeToken: nativeToken,
            run: this.context.run,
            action: functionName,
            step: 'invoke',
            amount: OldMoney.parseAmount(safeArgs.amount),
            asset: node.asset,
            tx: ''
        }

        const approve = await execTx(nodeTokenContract.approve(nodeContractAddress, safeArgs.amount), {
            logInfo: logInfo,
            log: false,
            ledger: true
        }, balanceBefore);
        // console.log("approve:", approve);
        // console.log(approve);

        // uint256[] public tierAllocPoints = [1 ether, 1 ether, 1 ether];
        // uint256[] public tierAmounts = [50 ether, 500 ether, 5000 ether];

        const fn = contract[functionName];
        // const nodeTier = this.entity.hre.utils.parseEther("1.0");
        const nodeTier = 0;
        // const numNodes = this.entity.hre.utils.parseEther("1.0");
        const numNodes = 1;
        const args = [nodeTier, numNodes];

        logInfo.label = `${safeArgs.protocol}.${functionName}[nodeTier ${nodeTier}][numNodes ${numNodes}]`;

        const result = await execTx(await fn.apply(null, args), {
            logInfo: logInfo,
            log: true,
            ledger: true
        }, balanceBefore);

        return result;
    }
}