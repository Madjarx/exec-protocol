import { BigNumber, NumberLike, BigNumberLike, NativeNumberLike } from './Types';
import Checks from '../safety/Checks';

type NumberRange = {min:number, max:number}

enum NumberType {
    FLOAT = 'float',
    INTEGER = 'integer',
    BIG_NUMBER = 'bigNumber',
}

//region class NumberBounds
type SafetyBounds = {

    type: NumberType;
    range: NumberRange;

}
//endregion

//region class BoundedNumber<T extends NumberLike>
class SafeNumber<T extends NumberLike> {

    readonly bounds: SafetyBounds;
    readonly value: T;

    constructor(value: T, {type, range}: SafetyBounds) {
        // TODO: the caller should have done these checks? (type converts?)
        this.value = value;
        this.bounds = {type, range};

        // TODO: check this....
        // Checks.assert(this.bounds.isCompatibleValue(value), 'value is not compatible with bounds');
        Numbers.shouldBeWithinRange(this.value, this.bounds.range);
    }

    static of<T extends NumberLike>(value: T, bounds: SafetyBounds) {
        // TODO: check this shit
        return new SafeNumber<T>(value, bounds);
    }

}
//endregion

class Numbers {

    static shouldBeWithinRange(value: NumberLike, {min,max}: NumberRange, message?:string) {
        // make sure the value is within the bounds
        Checks.assert(value >= min, `value must be greater than or equal to min: ${message}`);
        Checks.assert(value <= max, `value must be less than or equal to max: ${message}`);
    }

    static toNativeNumber(numberLike: NumberLike): number {
        if (typeof numberLike === 'number') {
            return numberLike;
        }
        if (typeof numberLike === 'string') {
            return parseFloat(numberLike);
        }
        if (numberLike instanceof BigNumber) {
            return numberLike.toNumber();
        }
        throw new Error(`Cannot convert ${numberLike} to number`);
    }

}

// export {formatUnits, parseUnits} from './Units';
export { SafetyBounds };
export { SafeNumber };
export { NumberRange };

export { BigNumber };
export { BigNumberLike };
export { NativeNumberLike };
export { NumberLike };

export default Numbers;