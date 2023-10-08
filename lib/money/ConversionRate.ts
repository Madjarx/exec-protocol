import util from 'util';
import { BigNumber } from 'ethers';

import { EntityRef } from "../src/classes/Entity";
import CurrencyUnit from './CurrencyUnit';
import Money from './Money';
import {Entity} from '../src/classes/Entity';

interface ConversionRateRequestParams {
    sourceAddress: string,
    destinationAddress: string,
    entity: Entity
}

interface ConversionRateLoader {
    fetchRate({ sourceAddress: tokenInAddress, destinationAddress: tokenOutAddress, entity}: ConversionRateRequestParams): Promise<BigNumber>
}

class ContractConversionRateLoader implements ConversionRateLoader {

    async fetchRate({ sourceAddress, destinationAddress, entity}: ConversionRateRequestParams) {
        const contract = await entity.getContract();
        
        return  contract.getAmountsOut(Money.toOne(), [sourceAddress, destinationAddress]);
    }

}

export default class ConversionRate {

    transactionCurrency: CurrencyUnit;
    referenceCurrency: CurrencyUnit;
    private rate: BigNumber | undefined;

    constructor({ transactionCurrency, referenceCurrency }: { transactionCurrency: CurrencyUnit, referenceCurrency: CurrencyUnit }) {
        this.transactionCurrency = transactionCurrency;
        this.referenceCurrency = referenceCurrency
    }

    [util.inspect.custom]() {
        return this.toString();
    }
}

