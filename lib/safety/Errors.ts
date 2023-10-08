import util from "util";

export default class Errors {
    
    private constructor() {

    }

    static unreachable(message?:string) {
        throw new Error('Method not reachable: ' + message);
    }

    static throwNotImplemented(message: string = 'Method not implemented.') {
        throw new Error(message);
    }

    static throwNotSure<T>(value: any, message: string): T {
        throw new Error(`${message}: ${util.inspect(value)}`);
    }

    static throw(message: string) {
        throw new Error(message);
    }

}