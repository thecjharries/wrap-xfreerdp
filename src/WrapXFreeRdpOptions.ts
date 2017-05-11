import * as Promise from 'bluebird';
const fsp = require('fs-promise');
import { WrapXFreeRdpArguments } from './interfaces/WrapXFreeRdpArguments';
import { WrapXFreeRdpFlags } from './interfaces/WrapXFreeRdpFlags';

export class WrapXFreeRdpOptions {
    private DIRECTORY_CONFIG_PATH: string = './.wrapxfreerdprc';
    private GLOBAL_CONFIG_PATH: string = '~/.wrapxfreerdprc';
    private _flags: WrapXFreeRdpFlags;

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
                if (first[key] !== null && typeof first[key] === 'object') {
                    if (!second.hasOwnProperty(key)) {
                        second[key] = {};
                    }
                    this.copyAndOverwriteFromFirstToSecond(first[key], second[key]);
                } else {
                    second[key] = first[key];
                }
            }
        }
        return second;
    }

    public attachCliArgumentsToFlags(argv: WrapXFreeRdpArguments, options: WrapXFreeRdpFlags): WrapXFreeRdpFlags {
        delete argv._;
        delete argv.configFile;
        return this.copyAndOverwriteFromFirstToSecond(argv, options);
    }

    public loadConfig(argv: WrapXFreeRdpArguments): Promise<WrapXFreeRdpFlags> {
        let target = '';
        return this.verifyAndReturnTarget(argv)
            .then((verifiedTarget: string) => {
                target = verifiedTarget;
            })
            .then(() => {
                return this.loadConfigFrom(this.GLOBAL_CONFIG_PATH, false);
            })
            .then((globalOptions: WrapXFreeRdpFlags) => {
                this._flags = globalOptions;
                return this.loadConfigFrom(this.DIRECTORY_CONFIG_PATH, false);
            })
            .then((directoryOptions: WrapXFreeRdpFlags) => {
                this._flags = this.copyAndOverwriteFromFirstToSecond(directoryOptions, this._flags);
                if (argv.configFile) {
                    return this.loadConfigFrom(argv.configFile, true)
                        .then((randomOptions) => {
                            return this.copyAndOverwriteFromFirstToSecond(randomOptions, this._flags);
                        });
                }
                return this._flags;
            })
            .then((options) => {
                this._flags = options;
                if (options[target]) {
                    return this.copyAndOverwriteFromFirstToSecond(options[target], this._flags);
                }
                return this._flags;
            })
            .then((options) => {
                this._flags = options;
                return this._flags;
            });
    }

    public loadAndAttachConfig(argv: WrapXFreeRdpArguments): Promise<WrapXFreeRdpFlags> {
        return this.loadConfig(argv)
            .then((options: WrapXFreeRdpFlags) => {
                return this.attachCliArgumentsToFlags(argv, options);
            });
    }

    public get flags(): WrapXFreeRdpFlags {
        return this._flags;
    }
}
