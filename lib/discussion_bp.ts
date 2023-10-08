// import { BigNumber, ethers } from "ethers";
// import util from "util";

// const ZERO = BigNumber.from('0');
// const INSPECT = util.inspect.custom;

// // TODO: fix this
// function toDigits(num:BigNumber, digits:number) {
//     return num.toString();  // TODO: check the BigNumber docs for how to change precision (string of value with precision).
// }

// // TODO: goal: formatAmount(1000000000000000000, digits) -> "0.1"
// // TODO: needs to leverage these functions with "digits aware" conversion.
// // ethers.utils.parseEther
// // ethers.utils.parseUnits
// class CurrencyUnit {

//     symbol: string;
//     digits: number;

//     toString(): string {
//         return this.symbol
//     }

//     toJSON(): object {
//         return {
//             symbol: this.symbol,
//             digits: this.digits,
//         }
//     }

//     [INSPECT]() : string {
//         return `[currency:${this.symbol} (digits:${this.digits})]`;
//     }

//     static formatAmount(amount:BigNumber, digits:number) : string {
//         return ``   // TODO: goal: formatAmount(1000000000000000000, digits) -> "0.1"
//     }

//     static formatMoney(money:Money) : string {
//         return `${CurrencyUnit.formatAmount(money.amount, money.currencyUnit.digits)} ${money.currencyUnit.symbol}`
//     }

//     /**
//      * return a well-formatted string representation of money amount ()
//      * 
//      * @param money 
//      * @returns 
//      */
//     formatAmount(amount:BigNumber) : string {
//         return CurrencyUnit.formatAmount(amount)
//     }

//     toHumanizedString(money:Money): string {
//         return `${this.formatMoney(money)} ${this.symbol}`
//     }

//     parseMoney(num:BigNumber) {
//         // WEI -> ETH
//     }
// }

// class Money {
//     amount: BigNumber = ZERO;
//     currencyUnit: CurrencyUnit;

//     constructor() {
        
//     }

//     toString() : string {
//         return `${this.amount} ${this.currencyUnit}`
//     }
    
//     toJSON() : object {
//         return {
//             amount: this.amount,
//             currencyUnit: this.currencyUnit,
//         };
//     }

//     [util.inspect.custom](): object {
//         return this.toJSON();
//     }
// }

// class ConversionRate {
//     // TODO: there are some nuance complexities in how to use this class.
//     // TODO: this class took me some time to figure out the "best way" on, so when it matters I'll grab that code from my other computer.
//     transactionCurrency: CurrencyUnit;
//     referenceCurrency: CurrencyUnit;
//     rate: BigNumber;
// }

// class ConvertedMoney {

//     sourceMoney: Money | undefined;
//     destinationMoney: Money | undefined;
//     date: Date = new Date();

//     get conversionRate(): ConversionRate {
//         // TODO: this could be calculated each time
//         return ConversionRate.calculate({
//             date: this.date,
//             sourceMoney: this.sourceMoney,
//             destinationMoney: this.destinationMoney,
//         })
//     }

//     toJSON(): object {
//         return {
//             sourceMoney: this.sourceMoney,
//             destinationMoney: this.destinationMoney,
//             conversionRate: this.conversionRate,
//         };
//     }
// }

// // source is "original" (ETH) and destination is "humanized" (USD)
// class HumanizedMoney extends ConvertedMoney {

//     constructor({money, conversionRate}) {
//         super({money, conversionRate});
//         this.sourceMoney = money;
//         this.destinationMoney = conversionRate.toDestinationMoney(this.sourceMoney);
//     }

//     // get humanizedCurrency(): CurrencyUnit | undefined {
//     //     return this.destinationMoney?.currencyUnit;
//     // }

//     // this would be in USD for example
//     get humanizedValue(): Money | undefined {
//         return this.destinationMoney;
//     }

//     toJSON(): object {
//         return {
//             money: this.sourceMoney,
//             value: this.destinationMoney,
//             rate: this.conversionRate,
//         }
//     }

//     toString(): string {
//         // '1.0 ETH (~ $300)
//         return `${this.sourceMoney} (~ ${this.humanizedValue})`
//     }

//     [util.inspect.custom]() {
//         return this.toJSON();
//     }
// }

// class HumanizedConvertedMoney extends ConvertedMoney {
//     money: Money;
//     conversionRate: ConversionRate;
// }

// class HarvestableBucket {

//     displayName: string;
    
//     bucket: HumanizedMoney;
//     rewards: HumanizedMoney;

//     constructor({}) {

//     }

//     // '[Bucket: 1.0 ETH (~ $300) (rewards: 0.1 WINE (~ $100))]
//     // '[WINERY_MIM_GRAPE: 1.0 ETH (~ $300) (rewards: 0.1 WINE (~ $100))]
//     // '[WINERY_MIM_GRAPE: 1.0 ETH (~ $300) (rewards: 0 WINE (~ $0))]
//     // '[WINERY_MIM_GRAPE: "1.0 ETH (~ $300)" (claimable: 0 GRAPE (~ $0)) (rewards: 0 WINE (~ $0))]
//     toString(): string {
//         return `[${this.displayName}: ${this.bucket} (rewards: ${this.rewards})]`
//     }

//     toJSON(): object {
//         return {
//             // bucket: HumanizedConvertedMoney.humanize(this.bucket, this.conversionRate),
//             bucket: this.bucket,
//             rewards: this.rewards,
//         };
//     }   

//     // this method is basically the whole point.
//     [INSPECT]() : object {
//         return {
//             bucket: this.bucket,
//             rewards: this.rewards,
//         };
//     }

// }