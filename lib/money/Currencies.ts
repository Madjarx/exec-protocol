import util from 'util';
import Checks from '../safety/Checks';
import Digits, { UnsafeDigits, SafeDigits } from "./Digits";
import exp = require("constants");

class CurrencyUnit {

    // static ether:number = 18;
    /*finney:number = 15;
    szabo:number = 12;
    gwei:number = 9;
    mwei:number = 6;
    kwei:number = 3;
    wei:number = 0;*/

    static USD = CurrencyUnit.of(
        "United States Dollars",
        "USD",
        2);

    static ETH: CurrencyUnit = CurrencyUnit.to({
        name: 'Ethereum',
        symbol: 'ETH',
        digits: Digits.of(18)
    });

    static BTC = CurrencyUnit.to({
        name: 'Bitcoin',
        symbol: 'BTC',
        digits: 8,
    });

    name: string | undefined;
    symbol: string;
    digits: SafeDigits;

    protected constructor({name, symbol, digits}: { name: string | undefined, symbol: string, digits: SafeDigits }) {
        this.digits = digits;
        this.name = name || `CurrencyUnit`;
        this.symbol = symbol;

        Checks.shouldBeNonBlankString(symbol)
        Checks.shouldBeOnlyLetters(symbol)
        Checks.shouldBeNativeNumberWithinRange(symbol.length, {
            min: 2,
            max: 4
        });
    }

    toString() {
        return this.symbol;
    }

    [util.inspect.custom]() {
        return this.toString();
        // return `[currency:${this.symbol} (digits:${this.digits})]`;
    }

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    static of(name:string, symbol:string, decimals:number) : CurrencyUnit {
        return CurrencyUnit.to({
            name,
            symbol,
            digits: Digits.of(decimals, decimals)
        })
    }

    static to({name, symbol, digits}: { name: string | undefined, symbol: string, digits: UnsafeDigits }) : CurrencyUnit {
        return new CurrencyUnit({
            name,
            symbol,
            digits: Digits.to(digits)
        });
    }

}
export { Digits };
export { SafeDigits };
export { CurrencyUnit };

export default class Currencies {

    static USD = CurrencyUnit.USD;
    static ETH = CurrencyUnit.ETH;
    static BTC = CurrencyUnit.BTC;

    of(name:string, symbol:string, decimals:number) : CurrencyUnit {
        return CurrencyUnit.of(name, symbol, decimals)
    }

    to({name, symbol, digits}: { name: string | undefined, symbol: string, digits: UnsafeDigits }) {
        return CurrencyUnit.to({
            name,
            symbol,
            digits: Digits.to(digits)
        });
    }
}