import * as Promise from 'bluebird';
const fsp = require('fs-promise');
import { Arguments } from './interfaces/Arguments';

export class WrapXFreeRdpOptions {
    public constructor() {
        return this;
    }

    public verifyAndReturnTarget(argv: Arguments): Promise<string> {
        if (argv._.length < 1) {
            return Promise.reject('No target specified, exiting');
        } else if (argv._.length > 1) {
            return Promise.reject('Too many targets specified, exiting');
        }
        return Promise.resolve(argv._[0]);
    }

    public loadConfigFrom(path: string, userSpecified: boolean): Promise<any> {
        return fsp
            .readJson(path)
            .then((contents: any) => {
                return contents;
            })
            .catch((error: any) => {
                if (userSpecified) {
                    return Promise.reject(`Can't find ${path}, exiting`);
                }
                return {};
            });
    }

    public copyAndOverwriteFromFirstToSecond(first: any, second: any): any {
        for (let key in first) {
            if (first.hasOwnProperty(key)) {
                second[key] = first[key];
            }
        }
        return second;
    }
}
