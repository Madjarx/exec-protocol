import {Context} from "../classes/Context"
import {ContextRef} from "../classes/Context"

export interface EntityRef { ABI: Array<{}>, address: string; name: string, hre: any}
/** Entity contains the thing we want to touch/interaction with (contract)*/
export class Entity {

    private ABI: Array<{}>;
    private address: string;
    public name: string;
    private context: Context;

    public hre: any;

    constructor(ref: EntityRef, ctx: ContextRef) {
        // constructor(obj: { ABI: Array<{}>; address: string; context: Context; }) {
        this.name = ref.name;
        this.ABI = ref.ABI;
        this.address = ref.address;
        this.hre = ref.hre;
        this.context = Context.fromRef(ctx);
    }

    public async getContract() {
        // console.log("context:", this.context);
        return await this.hre.getContractAt(this.ABI, this.address);
    }

    static fromRef(ref: EntityRef | Entity, context: Context | ContextRef): Entity {
        if (ref instanceof Entity) return ref;
        return new Entity(ref, Context.fromRef(context));
    }

}