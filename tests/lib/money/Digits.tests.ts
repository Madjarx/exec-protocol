import 'mocha';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

import Digits, { SafeDigits } from '../../../lib/money/Digits';
import Numbers from '../../../lib/types/Numbers';


// import { SafeDigits, DigitsLike, NumberLike } from '../../lib/money/CurrencyUnit'

function countDecimals(value: number) {
    if (Math.floor(value) === value) {
        return 0;
    } else {
        return value.toString().split(".")[1].length || 0;
    }
}

describe('Types/Numbers', () => {

    [
        '0', 0, '1', '1.1'
    ].forEach(v => it('should return a number', () => expect(Numbers.toNativeNumber(v)).to.be.a('number')));

    // [
    //     '', null, undefined, 'a'
    // ].forEach(v => it('should throw an error', () => expect(() => Numbers.toNativeNumber(v)).to.throw()));

    // it('', () => expect(Numbers.isNumber('1')).to.be.true)
    // it('', () => expect(Numbers.isNumber(null)).to.be.true)
    // it('', () => expect(Numbers.isNumber(undefined)).to.be.true)
});

describe('SafeDigits', () => {

    const ONE = BigNumber.from(1);
    const FIVE = BigNumber.from(5);
    const SIX = BigNumber.from(6);
    const SEVEN = BigNumber.from(7);

    // DAN TODO: add tests for passing in undefined & null & string & number & BigNumber
    // DAN TODO: add tests for invalid input of decimals ("5.5") & invalid numbers ("5.5.5")

    // const DECIMAL = BigNumber.from(7.36);

    // describe('of', () => {
    //   it('digits: 6', () => expect(SafeDigits.of(SIX).rendering).to.eq(6));
    //   it('digits: 7', () => expect(SafeDigits.of(SEVEN).rendering).to.eq(7));
    //
    //   [ONE, FIVE, undefined].forEach(v => it('should throw error', () => expect(() => SafeDigits.of(v)).to.throw()));
    // });
});

// def('digits', 9);
// def('digits', 9);

// describe('Digits', () => {

//   def('digits', () => 3);

// });
// it('should be able to create a DigitsHolder', () => {
//   console.log($digits);
// });

// describe('Digits - safe scenarios', () => {
//   [
//     { value: 0, decimals: 0 },
//     { value: 0.1, decimals: 1 },
//     { value: 0.01, decimals: 2 },
//   ].forEach(scenario => {

//     describe(`scenario: ${scenario}`, () => {

//       it('should have correct decimals', () => {
//         const digits = new DigitsHolder(scenario.value, scenario.decimals);
//         expect(digits.decimals).to.equal(scenario.decimals);
//       })

//       it('should have correct value', () => {
//         const digits = new DigitsHolder(scenario.value, scenario.decimals);
//         expect(digits.value).to.equal(scenario.value);
//       });

//     })

//   }
// });

// describe('DigitsHolder', () => {

//   describe('constructor', () => {
//     const digits = 18;
//     const precision = 4;

//     it('should construct', () => new DigitsHolder({ digits, precision }));

//   });

//   describe('toDigits', () => {
//     it('should return a number', () => expect(DigitsHolder.toDigits(6)).to.be.a("number"));
//     it('should return 6 decimals', () => expect(countDecimals(DigitsHolder.toDigits(6))).to.equal(6));
//   })

//   describe('toHolder', () => {
//     it('should return an instance of Digits Holder', () => expect(DigitsHolder.toHolder(6)).to.be.an.instanceOf(DigitsHolder));
//   })

//   describe('humanize', () => {
//     const dh = new DigitsHolder({ digits: 18, precision: 4 });
//     const bn = BigNumber.from(10000000000);

//     it('should return a string', () => expect(dh.humanize(bn)).to.be.a("string"));
//     // it('should ', () => expect(dh.humanize("1000000")).to.throw(Error));

//   })

// });