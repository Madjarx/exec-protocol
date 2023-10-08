const fs = require("fs");
const os = require("os");

export class EnvUtil {

    public static setEnvValue(filepath: string, key: string, value: string) {

        // read file from hdd & split if from a linebreak to a array
        const ENV_VARS = fs.readFileSync(filepath, "utf8").split(os.EOL);
    
        // find the env we want based on the key
        const target = ENV_VARS.indexOf(ENV_VARS.find((line:any) => {
            return line.match(new RegExp(key));
        }));
    
        // replace the key/value with the new value
        ENV_VARS.splice(target, 1, `${key}=${value}`);
    
        // write everything back to the file system
        fs.writeFileSync(filepath, ENV_VARS.join(os.EOL));
    
    }

    public static toNumber(amount: string) {
        let result: number;
        try {
            result = parseFloat(amount);
        } catch (err) {
            console.log(err);
            process.exit();
        }
        return result;
    }

    public static toBoolean(value: string) {
        let result: boolean;
        if (value === "true") {
            result = true;
        } else if (value === "false") {
            result = false;
        } else {
            throw new Error("EnvUtil: unrecognized boolean in value. (valid values are TRUE or FALSE)");
        }
        return result;
    }
}