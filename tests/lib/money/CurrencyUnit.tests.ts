import 'mocha';
import { expect } from 'chai';

import Currencies, { CurrencyUnit } from '../../../lib/money/Currencies';

describe('CurrencyUnit', () => {

  // [ETH, BTC].forEach(currency => it(`should have a currency of ${currency}`, () => expect(currency.currency).to.equal(currency)))))));

  describe('constructor', () => {
    const name = 'Ethereum';
    const symbol = 'ETH';
    const digits = 18;

    it('should construct', () => CurrencyUnit.to({ name, symbol, digits }));
    // it('should allow empty name', () => new CurrencyUnit({ name: undefined, symbol, digits }));
    // it('should allow empty precision', () => new CurrencyUnit({ name, symbol, digits, precision: undefined }));

    // it('should not allow symbol to be undefined', () => expect(() => new CurrencyUnit({ name, symbol:undefined, digits: 18, precision: 0 })).to.throw(Error));
    // it('should not allow empty symbol', () => new CurrencyUnit({ name, symbol: undefined, digits }));
    // it('should not allow 0 precision', () => expect(() => new CurrencyUnit({ name, symbol, digits: 18, precision: 0 })).to.throw(Error));
  });

  describe('toString', () => {
    it('should look like this', () => expect(Currencies.ETH.toString()).to.equal('ETH'));
  })

  /*
  describe('humanize amount', () => {
    it('should return a string', () => 
    expect(CurrencyUnit.toHumanizedAmount(
      BigNumber.from("123456789123456789"), 
      new HumanizedDigits({digits: 18, precision: 4}))
      ).to.be.a("string"));
  })
  */

});