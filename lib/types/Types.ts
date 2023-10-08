import { BigNumber } from 'ethers';

type NativeNumberLike = number | string;
type BigNumberLike = NativeNumberLike | BigNumber;
type NumberLike = NativeNumberLike | BigNumberLike;

class Types {

    ////////////////////////////////////////////////////////////
    static isNativeNumber(value: any): boolean {
        return typeof value === 'number' //|| value instanceof BigNumber;
    }
    ////////////////////////////////////////////////////////////

}

export {
    NumberLike,
    BigNumberLike,
    NativeNumberLike
};
export {
    BigNumber
}

export default Types;