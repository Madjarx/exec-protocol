import 'mocha';
import { expect } from 'chai';

import Money from '../../../lib/money/Money';
import Currencies, { CurrencyUnit } from '../../../lib/money/Currencies';

describe('CurrencyUnit', function () {

    describe('toString', () => {
        it('should only be the symbol',
            () => expect(Currencies.ETH.toString())
                .to.equal('ETH'));
    });

});

describe('Money', () => {

    // [ETH, BTC].forEach(currency => it(`should have a currency of ${currency}`, () => expect(currency.currency).to.equal(currency)))))));

    describe('digits', function () {
        describe('USD', function () {
            it('should parse as 2',
                () =>
                    expect(Currencies.USD)
                        .to.have.property('digits')
                        .to.have.property('parsed').to.equal(2));
            it('should format as 2',
                () => expect(Currencies.USD)
                    .to.have.property('digits')
                    .to.have.property('formatted').to.equal(2));
        });
    });

    describe('ofFormatted', function () {
        describe('0', function () {
            it('should be 0',
                () =>
                    expect(Money.ofFormatted(0, Currencies.USD).toString())
                        .to.equal('0.00 USD'));
        });
        describe('1.00 USD', function () {
            [
                '1.0',
                '1.00',
                '1.000',
                '01.000',
                '01',
                '1',
            ].forEach(amount => {
                it(`${amount}`, function () {
                    const money = Money.ofFormatted(amount, CurrencyUnit.USD);

                    it('money.toString() should be "0.01 USD"',
                        () => expect(money.toString()).to.equal('0.01 USD'));

                    it('money.amount.toString() should be "100"',
                        () => expect(money.amount.toString()).to.equal('100'));

                    it('money.parsedAmount should be "100"',
                        () => expect(money.parsedAmount).to.equal('100'));

                    it('money.formattedAmount should be "1.00"',
                        () => expect(money.formattedAmount).to.equal('0.01'));
                });
            })
        });
    });

    describe('ofParsed', function () {
        describe('0', function () {
            it('should be 0',
                () =>
                    expect(Money.ofParsed(0, Currencies.USD).toString())
                        .to.equal('0.00 USD'));
        });

        describe('100', function () {
            [
                '100',
                '0100',
            ].forEach(amount => {
                it(`${amount}`, function () {
                    const money = Money.ofParsed(amount, CurrencyUnit.USD);

                    it('money.toString() should be "0.01 USD"',
                        () => expect(money.toString()).to.equal('0.01 USD'));

                    it('money.amount.toString() should be "100"',
                        () => expect(money.amount.toString()).to.equal('100'));

                    it('money.parsedAmount should be "100"',
                        () => expect(money.parsedAmount).to.equal('100'));

                    it('money.formattedAmount should be "1.00"',
                        () => expect(money.formattedAmount).to.equal('0.01'));
                });
            })
        });
    });

});