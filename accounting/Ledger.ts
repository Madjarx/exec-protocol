import * as fs from 'fs/promises';
import { PathLike } from 'fs';
import { exec } from "node:child_process";
import util from "node:util";

import { Balances } from '../tasks/tasks';


////////////////////////////////////////////////
    /*
    for Protocols:
    assets:protocols:{protocol}:{chain}:{pool}:{measure}
    assets:protocols:grapefinance:AVAX:grapemimlp:yields
    assets:protocols:grapefinance:AVAX:grapemimlp:rewards
    assets:protocols:grapefinance:AVAX:grapemimlp:deposits

    assets:protocols:grapefinance:AVAX:grapenode:count
    assets:protocols:grapefinance:AVAX:grapenode:yields

    for Wallets:
    assets:wallets:{id}:{chain}:{asset<token|coin|currency>}
    assets:wallets:0x14815bC2CcdbA41AabeFa9691a4F170cC35Fc1D6:AVAX:MIM
    */
//////////////////////////////////////////////// 

export default class Ledger {    

    public filename: string;
    public filepath: PathLike | fs.FileHandle = '';

    constructor({ filename }: { filename: string }) {
        this.filename = filename + '.journal';
        this.filepath = 'accounting/' + this.filename;
    };

    async createFile() {
        if (this.filepath) {
            // TODO: check before if file already exists, because it will override
            try {
                await fs.writeFile(this.filepath, '');

            } catch (err) {
                console.log(err);
            }
        }
    }

    async setInitialBalances(balances: Balances) {
        const isodate = new Date().toISOString().split('T')[0];
        let line = isodate + ' opening balances' + '\n';
        await fs.appendFile(this.filepath, line);

        for (const [k, v] of Object.entries(balances['wallet'])) {
            line = '\t' + 'assets:wallet:' + k.toLowerCase() + '\t\t\t\t' + v['amount'] + ' ' + k + '\n';
            await fs.appendFile(this.filepath, line);
        }

        for (const [k, v] of Object.entries(balances['buckets'])) {
            line = '\t' + 'assets:buckets:' + k.toLowerCase() + '\t\t\t\t' + v['amount'] + ' ' + k + '\n';
            await fs.appendFile(this.filepath, line);
        }

        line = '\t' + 'equity';
        await fs.appendFile(this.filepath, line);
    }

    async setPricingInfo(balances: Balances) {

        const isodate = new Date().toISOString().split('T')[0];
        let line = '\n\n';
        await fs.appendFile(this.filepath, line);

        for (const [k, v] of Object.entries(balances['wallet'])) {
            let line = 'P ' + isodate + ' ' + k.toLowerCase() + ' ' + v['price'] + '\n';
            await fs.appendFile(this.filepath, line);
        }
        
    }

    async execCommand(cmd: string){
        const execPromise = util.promisify(exec);
        try {
            // wait for exec to complete
            const { stdout, stderr } = await execPromise(cmd);
            console.log(stdout);
        } catch (error) {
            console.log(error);
        }
    }


    async printBalanceSheet() {
        console.log('printBalanceSheet');
        //const cmd = 'hledger -f ledger/ledger.journal bal -YEB'
        const cmd = 'hledger -f ' + this.filepath + ' bs';
        await this.execCommand(cmd);
    }

    async printRegister() {
        const cmd = 'hledger -f ' + this.filepath + ' register';
        this.execCommand(cmd);
    }

    async checkFileExists(): Promise<boolean|undefined>{

        let exists;
        try {
            await fs.readFile(this.filepath)
                .then(function (result: any) {
                    // console.log("" + result);
                    exists = true;
                })
                .catch(function (error: any) {
                    console.log(error);
                    exists = false;
                })
        } catch (err) {
            console.error(err)
            exists = false;
        }

        return exists;

    }

    async execAddTransaction(delta: Balances, concept: string | undefined) {
        const parsedConcept = concept? concept:'';

        const isodate = new Date().toISOString().split('T')[0];
        let line = '\n\n' + isodate + ' ' + parsedConcept + '\n';
            await fs.appendFile(this.filepath, line);

        for (const [k, v] of Object.entries(delta['wallet'])) {
            line = '\t' + 'assets:wallet:' + k.toLowerCase() + '\t\t\t\t' + v['amount'] + ' ' + k + '\n';
            await fs.appendFile(this.filepath, line);
        }

        for (const [k, v] of Object.entries(delta['buckets'])) {
            line = '\t' + 'assets:buckets:' + k.toLowerCase() + '\t\t\t\t' + v['amount'] + ' ' + k + '\n';
            await fs.appendFile(this.filepath, line);
        }
        // let line = '\t' + 'equity';
        // await fs.appendFile(this.filepath, line);
    }

    async addTransaction(delta: Balances, concept: string | undefined) {

        const fileExists = await this.checkFileExists();

        if (fileExists) {
            // console.log('fileexists!');
            await this.execAddTransaction(delta, concept);
        } else {
            // console.log('file does not exist!');
            this.filename = 'ledger' + '.journal';
            this.filepath = 'accounting/' + this.filename;
            await this.createFile();
            await this.execAddTransaction(delta, concept);
        }

    }

    async getPnL() {
        console.log("getPnL: to-do");
        /*
        const execPromise = util.promisify(exec);
        const cmd= 'hledger -f ledger/ledger.journal roi --inv Assets -b 2022-01-01 -e 2022-12-31 --pnl  Income --yearly --value=then';
        try {
            // wait for exec to complete
            const { stdout, stderr } = await execPromise(cmd);
            console.log(stdout);
        } catch (error) {
            console.log(error);
        }
        */
    }

    

}