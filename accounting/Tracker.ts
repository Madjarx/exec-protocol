import * as fs from 'fs/promises';
import { PathLike } from 'fs';
import { exec } from "node:child_process";
import util from "node:util";

import { Balances } from '../tasks/tasks';


export default class Tracker {

    public filename: string;
    public filepath: PathLike | fs.FileHandle = '';

    constructor({ filename }: { filename: string }) {
        this.filename = filename + '.csv';
        this.filepath = 'accounting/' + this.filename;
    };

    async createFile() {
        if (this.filepath) {
            // TODO: check before if file already exists, because it will override
            try {

                const header = 'Date, Concept, Account, Asset, Amount';
                await fs.appendFile(this.filepath, header);

            } catch (err) {
                console.log(err);
            }
        }
    }


    async execCommand(cmd: string) {
        const execPromise = util.promisify(exec);
        try {
            // wait for exec to complete
            const { stdout, stderr } = await execPromise(cmd);
            console.log(stdout);
        } catch (error) {
            console.log(error);
        }
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
        const parsedConcept = concept ? concept : '';

        const isodate = new Date().toISOString()

        for (const [k, v] of Object.entries(delta['wallet'])) {
            const line = '\r\n' + isodate + ',' + parsedConcept + ',' + 'wallet' + ',' + k.toLowerCase() + ',' + v['amount'];
            await fs.appendFile(this.filepath, line);
        }

        for (const [k, v] of Object.entries(delta['buckets'])) {
            const line = '\r\n' + isodate + ',' + parsedConcept + ',' + 'buckets' + ',' + k.toLowerCase() + ',' + v['amount'];
            await fs.appendFile(this.filepath, line);
        }
    }

    async addTransaction(delta: Balances, concept: string | undefined) {

        const fileExists = await this.checkFileExists();

        if (fileExists) {
            // console.log('fileexists!');
            await this.execAddTransaction(delta, concept);
        } else {
            // console.log('file does not exist!');
            this.filename = 'tracker' + '.csv';
            this.filepath = 'accounting/' + this.filename;
            await this.createFile();
            await this.execAddTransaction(delta, concept);
        }

    }


}