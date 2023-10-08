import { BigNumber } from "ethers";
import util from "util";
import { parseUnits } from "ethers/lib/utils";

import Currencies, { CurrencyUnit } from './Currencies';
import Numbers, { NumberLike, BigNumberLike } from "../types/Numbers";
import { normalizeName } from "typechain";

const ZERO = BigNumber.from('0');
const INSPECT = util.inspect.custom;

interface MoneyLike {
    amount: BigNumber,
    currencyUnit: CurrencyUnit
}

export default class Money {

    amount: BigNumber = ZERO;
    currencyUnit: CurrencyUnit;

    protected constructor({amount, currencyUnit}: MoneyLike) {
        this.amount = amount;
        this.currencyUnit = currencyUnit;
    }

    get formattedAmount() {
        return this.currencyUnit.digits.format(this.amount);
    }

    get parsedAmount() {
        return this.amount.toString();
    }

    toString(): string {
        return Money.formatString(this);
    }

    toJSON() {
        return {
            amount: this.amount.toString(),
            display: this.currencyUnit.digits.format(this.amount),
            currencyUnit: this.currencyUnit.toString()
        }
    }

    [util.inspect.custom]() {
        return this.toJSON();
    }

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    // static toHumanizedString(money: Money): string {
    //     return `${CurrencyUnit.toHumanizedAmount(
    //         money.amount,
    //         money.currencyUnit.digits
    //     )} ${money.currencyUnit.symbol}`
    // }

    ////////////////////////////////////////////////////////////

    static ofFormatted(amount: NumberLike, currencyUnit: CurrencyUnit) {
        return Money.ofParsed(
            currencyUnit.digits.parse(String(amount)),
            currencyUnit
        );
    }

    static ofParsed(amount: BigNumberLike, currencyUnit: CurrencyUnit) {
        return new Money({
            amount: BigNumber.from(amount),
            currencyUnit
        });
    }

    static formatString(money: Money) {
        return `${Money.formatAmount(money)} ${money.currencyUnit}`;
    }

    static formatAmount(money: Money) {
        return money.currencyUnit.digits.format(money.amount);
    }

}

// MOVED
/*
export class CurrencyUnit {

    private name: string;
    private decimals: number;
    private symbol: string;

    constructor(obj: { name: string, decimals: number, symbol: string; }) {
        this.name = obj.name;
        this.decimals = obj.decimals;
        this.symbol = obj.symbol;
    }

    public getName() {
        return `${this.name}`;
    }

    public parseMoney(value: number): Money {
        return Money.parseMoney(value);
    }

    static asCurrency(currency: string) {
        if (!currency) throw new Error(`!currency = ${currency}`);
        if (currency instanceof CurrencyUnit) return currency;
        return new CurrencyUnit(currency);
      }
}

export class CurrencyPair {

    private transportCurrency: typeof CurrencyUnit;
    private referenceCurrency: typeof CurrencyUnit;
    private transactionCurrency: typeof CurrencyUnit;

    constructor(obj: { transportCurrency: typeof CurrencyUnit, referenceCurrency: typeof CurrencyUnit, transactionCurrency: typeof CurrencyUnit; }) {
        this.transportCurrency = obj.transportCurrency;
        this.referenceCurrency = obj.referenceCurrency;
        this.transactionCurrency = obj.transactionCurrency;
    }
}

export class Money {

    private currencyUnit: typeof CurrencyUnit;
    private value: string;
    private amount: number;


    constructor(currencyUnit: typeof CurrencyUnit, value: string, amount: number) {
        this.currencyUnit = currencyUnit;
        this.value = value;
        this.amount = amount;
    }

    public isGreaterThanOne() {
        // return this.value.gt(this.currency.parseUnits(1),);
    }

}
*/