import * as Promise from 'bluebird';
/* tslint:disable-next-line:no-var-requires */
const fsp = require('fs-promise');
import { IWrapXFreeRdpArguments } from './interfaces/IWrapXFreeRdpArguments';
import { IWrapXFreeRdpFlags } from './interfaces/IWrapXFreeRdpFlags';

export class WrapXFreeRdpOptions {
    private DIRECTORY_CONFIG_PATH: string = './.wrapxfreerdprc';
    private GLOBAL_CONFIG_PATH: string = '~/.wrapxfreerdprc';
    private internalFlags: IWrapXFreeRdpFlags = null;

    public constructor() {
        return this;
    }

    public verifyAndReturnTarget(argv: IWrapXFreeRdpArguments): Promise<string> {
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

    public copyAndOverwriteFromFirstToSecond(
        first: IWrapXFreeRdpArguments | IWrapXFreeRdpFlags,
        /* tslint:disable-next-line:trailing-comma */
        second: IWrapXFreeRdpFlags
    ): IWrapXFreeRdpFlags {
        for (const key in first) {
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

    public attachCliArgumentsToFlags(
        argv: IWrapXFreeRdpArguments,
        /* tslint:disable-next-line:trailing-comma */
        options: IWrapXFreeRdpFlags
    ): IWrapXFreeRdpFlags {
        delete argv._;
        delete argv.configFile;
        return this.copyAndOverwriteFromFirstToSecond(argv, options);
    }

    public loadConfig(argv: IWrapXFreeRdpArguments): Promise<IWrapXFreeRdpFlags> {
        let target = '';
        return this.verifyAndReturnTarget(argv)
            .then((verifiedTarget: string) => {
                target = verifiedTarget;
            })
            .then(() => {
                return this.loadConfigFrom(this.GLOBAL_CONFIG_PATH, false);
            })
            .then((globalOptions: IWrapXFreeRdpFlags) => {
                this.internalFlags = globalOptions;
                return this.loadConfigFrom(this.DIRECTORY_CONFIG_PATH, false);
            })
            .then((directoryOptions: IWrapXFreeRdpFlags) => {
                this.internalFlags = this.copyAndOverwriteFromFirstToSecond(
                    directoryOptions,
                    /* tslint:disable-next-line:trailing-comma */
                    this.internalFlags
                );
                if (argv.configFile) {
                    return this.loadConfigFrom(argv.configFile, true)
                        .then((randomOptions) => {
                            return this.copyAndOverwriteFromFirstToSecond(
                                randomOptions,
                                /* tslint:disable-next-line:trailing-comma */
                                this.internalFlags
                            );
                        });
                }
                return this.internalFlags;
            })
            .then((options) => {
                this.internalFlags = options;
                if (options[target]) {
                    return this.copyAndOverwriteFromFirstToSecond(
                        options[target],
                        /* tslint:disable-next-line:trailing-comma */
                        this.internalFlags
                    );
                }
                return this.internalFlags;
            })
            .then((options) => {
                this.internalFlags = options;
                return this.internalFlags;
            });
    }

    public loadAndAttachConfig(argv: IWrapXFreeRdpArguments): Promise<IWrapXFreeRdpFlags> {
        return this.loadConfig(argv)
            .then((options: IWrapXFreeRdpFlags) => {
                return this.attachCliArgumentsToFlags(argv, options);
            });
    }

    public get flags(): IWrapXFreeRdpFlags {
        return this.internalFlags;
    }
}
