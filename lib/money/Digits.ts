import Types from "../types/Types";
import { BigNumber, ethers } from "ethers";
import { BigNumberLike } from "../types/Numbers";

type DigitsSpec = { parsed: number, formatted: number }
type UnsafeDigits = string | number | DigitsSpec;

class SafeDigits implements Digits {

    // TODO: think of ways decimals could be checked for safety
    // TODO: check the range / bounds (i.e. no decimals larger than 100 and less than 5????)

    public readonly parsed: number;
    public readonly formatted: number;

    private constructor({parsed, formatted}: { parsed: number, formatted: number }) {
        this.parsed = parsed;
        this.formatted = formatted;

        // Actually, it turns out that in the USD case, storage can be 1, when display is 2,
        // if (this.display > this.storage) {
        //     throw new Error(`external decimals (${this.display}) cannot be larger than internal decimals (${this.storage})`);
        // }
    }

    parse(value: string) {
        return ethers.utils.parseUnits(value, this.parsed);
    }

    format(value: BigNumber): string {
        return parseFloat(
            ethers.utils.formatUnits(value, this.formatted))
            .toFixed(this.formatted);
    }

    static of(parsed: number, formatted: number = 5): SafeDigits {
        // TODO: do sanity checks here
        return new SafeDigits({
            parsed,
            formatted
        });
    }
}

export { UnsafeDigits };
export { SafeDigits };

export default class Digits {

    // public readonly storage: number;
    // public readonly display: number;
    //
    // private constructor(storage: number, display: number) {
    //     // NOTE: this should never get called
    //     this.storage = 1;
    //     this.display = 1;
    // }

    static to(digits: UnsafeDigits): SafeDigits {
        if (digits instanceof SafeDigits) {
            return digits;
        }

        if (Number.isSafeInteger(digits)) {
            return Digits.of(digits as number);
        }

        // TODO: check "is integer" here.
        if (Types.isNativeNumber((digits as DigitsSpec).parsed)) {
            const spec = digits as DigitsSpec;
            return Digits.of(spec.parsed, spec.formatted);
        }

        throw new Error(`Cannot convert ${digits} to Digits`);
    }

    static of(parsed: number, formatted: number = 4) {
        return SafeDigits.of(parsed, formatted);
    }

};