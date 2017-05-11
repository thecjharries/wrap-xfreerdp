import * as Promise from 'bluebird';
/* tslint:disable-next-line:no-var-requires */
const fsp = require('fs-promise');
import * as path from 'path';
import { WrapXFreeRdpArguments } from './interfaces/WrapXFreeRdpArguments';
import { WrapXFreeRdpFlags } from './interfaces/WrapXFreeRdpFlags';
import { WrapXFreeRdpValidator } from './interfaces/WrapXFreeRdpValidator';
import { WrapXFreeRdpOptions } from './WrapXFreeRdpOptions';


export class WrapXFreeRdpCommandBuilder {
    private options: WrapXFreeRdpOptions;
    private JSON_LOCATION: string = path.join(__dirname, 'config/flags-and-regex.json');
    private validatorPromise: Promise<WrapXFreeRdpValidator[]> = null;
    private loadEverythingPromise: Promise<any[]> = null;
    private argv: WrapXFreeRdpArguments;
    private internalCall: string = 'xfreerdp';

    public constructor(argv: WrapXFreeRdpArguments) {
        this.options = new WrapXFreeRdpOptions();
        this.argv = argv;
    }

    public loadValidators(): Promise<WrapXFreeRdpValidator[]> {
        if (this.validatorPromise === null) {
            this.validatorPromise = fsp.readJson(this.JSON_LOCATION);
        }
        return this.validatorPromise;
    }

    public loadEverything(): Promise<any[]> {
        if (this.loadEverythingPromise === null) {
            this.loadEverythingPromise = Promise.all([
                this.loadValidators(),
                this.options.loadAndAttachConfig(this.argv),
            ]);
        }
        return this.loadEverythingPromise;
    }

    public get call(): string {
        return this.internalCall;
    }

    public attachPlugins() {
        if (typeof this.options.flags.plugins !== 'undefined') {
            if ((this.options.flags.plugins as string[]).length > 0) {
                for (const plugin of (this.options.flags.plugins as string[])) {
                    this.internalCall += ` --plugin ${plugin}`;
                }
            }
        }
    }
}
