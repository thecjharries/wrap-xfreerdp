import * as Promise from 'bluebird';
const fsp = require('fs-promise');
import { WrapXFreeRdpArguments } from './interfaces/WrapXFreeRdpArguments';
import { WrapXFreeRdpFlags } from './interfaces/WrapXFreeRdpFlags';

export class WrapXFreeRdpOptions {
    public constructor() {
        return this;
    }

    public verifyAndReturnTarget(argv: WrapXFreeRdpArguments): Promise<string> {
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


    public copyAndOverwriteFromFirstToSecond(first: WrapXFreeRdpArguments | WrapXFreeRdpFlags, second: WrapXFreeRdpFlags): WrapXFreeRdpFlags {
        for (let key in first) {
            if (first.hasOwnProperty(key)) {
                second[key] = first[key];
            }
        }
        return second;
    }

    public attachCliArgumentsToOptions(argv: WrapXFreeRdpArguments, options: WrapXFreeRdpFlags): WrapXFreeRdpFlags {
        delete argv._;
        delete argv.configFile;
        return this.copyAndOverwriteFromFirstToSecond(argv, options);
    }
}
