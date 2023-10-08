import { BigNumber } from "ethers";
import * as ethers from "ethers";

export class OldMoney {

    public static toSafeMoneyWithLimit(amount: number) {
        let safeAmount: BigNumber;
        const limit = 100000;
        try {

            if (amount > limit) {
                throw new Error(`amount is above limit (${limit})`);
            }

            safeAmount = ethers.utils.parseEther(Number(amount).toFixed(18).toString());
        } catch (err) {
            console.log(err);
            process.exit();
        }

        if (safeAmount) {
            return safeAmount;
        } else {
            throw new Error("safeAmount error.");
        }

    }

    public static parseAmount(amount: BigNumber) {

        let result: number;
        try {
            result = parseFloat(ethers.utils.formatEther(amount));
        } catch (err) {
            console.log(err);
            process.exit();
        }

        return result;

    }


    public static toBigNumber(amount: number, decimals: number) {
        let result: BigNumber;
        try {
            result = ethers.utils.parseUnits(amount.toString(), decimals);
        } catch (err) {
            console.log(err);
            process.exit();
        }
        return result;


    }


}