import { Entity } from '../classes/Entity';
import { EntityRef } from '../classes/Entity';
import { Context } from '../classes/Context';
import { ContextRef } from '../classes/Context';
import { ContractReceipt } from "@ethersproject/contracts/src.ts";

export interface TaskArgs {
    name: string,
    context: ContextRef,
    entity: EntityRef;
}

//region Tasks
export class Task<TSafeArgs> {
    public safeArgs: TSafeArgs | undefined;
    private readonly name: string;
    protected context: Context;
    protected entity: Entity;

    constructor(obj: TaskArgs) {
        this.name = obj.name;
        this.context = Context.fromRef(obj.context);
        this.entity = Entity.fromRef(obj.entity, obj.context);
        const chainObj = this.context.chain;
        const chainId = chainObj.id;
        const nativeToken = chainObj.nativeToken;
        

        // this.context = Context.fromRef({address: obj.context.address, provider: obj.context.provider});
        // ASDF.fromASDF(obj.entity, this.context)
        this.entity = Entity.fromRef(obj.entity, this.context);
        // this.entity = Entity.fromRef({ABI: obj.entity.ABI, address: obj.entity.address, context: this.context});
        // this.entity = new Entity({ABI: obj.entity.ABI, address: obj.entity.address, context: this.context});

    }

    public getName() {
        return this.name;
    }

    public getContext() {
        return this.context;
    }

    public getEntity() {
        return this.entity;
    }

    public async execute(safeArgs: TSafeArgs): Promise<Object> {
        // public async execute(safeArgs: { protocol: string, amount: number; }) {
        // hre.ethers.provider.getBalance(account1.address);
        return Promise.reject(new Error(`not implemented`));
    }
}