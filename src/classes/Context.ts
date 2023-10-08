export interface ChainRef { id: string; type: string, chainId: number; nativeToken: string};
export interface ContextRef { address: string, provider: any; chain: ChainRef, run: number};

/** Context details such as Balances, Water levels...*/
export class Context {
    // TO-DO
    // private balance: number;
    // private waterLevel: number;
    public address: string;
    public provider: any;
    public chain: ChainRef;
    public run: number;

    constructor(obj: { address: string; provider: any; chain: ChainRef, run: number}) {
        this.address = obj.address;
        this.provider = obj.provider;
        this.chain = obj.chain;
        this.run = obj.run;
    }

    static fromRef(ctx: ContextRef | Context): Context {
        if (ctx instanceof Context) return ctx;
        return new Context(ctx);
    }
}