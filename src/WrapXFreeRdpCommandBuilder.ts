import * as Promise from 'bluebird';
const fsp = require('fs-promise');
import * as path from 'path';
import { WrapXFreeRdpArguments } from './interfaces/WrapXFreeRdpArguments';
import { WrapXFreeRdpFlags } from './interfaces/WrapXFreeRdpFlags';
import { WrapXFreeRdpOptions } from './WrapXFreeRdpOptions';
import { WrapXFreeRdpValidator } from './interfaces/WrapXFreeRdpValidator';

export class WrapXFreeRdpCommandBuilder {
    private options: WrapXFreeRdpOptions;
    private JSON_LOCATION: string = path.join(__dirname, 'config/flags-and-regex.json');
    private validatorPromise: Promise<Array<WrapXFreeRdpValidator>> = null;
    private loadEverythingPromise: Promise<Array<any>> = null;
    private argv: WrapXFreeRdpArguments;
    private _call: string = 'xfreerdp';

    public constructor(argv: WrapXFreeRdpArguments) {
        this.options = new WrapXFreeRdpOptions();
        this.argv = argv;
    }

    public loadValidators(): Promise<Array<WrapXFreeRdpValidator>> {
        if (this.validatorPromise === null) {
            this.validatorPromise = fsp.readJson(this.JSON_LOCATION);
        }
        return this.validatorPromise;
    }

    public loadEverything(): Promise<Array<any>> {
        if (this.loadEverythingPromise === null) {
            this.loadEverythingPromise = Promise.all([
                this.loadValidators(),
                this.options.loadAndAttachConfig(this.argv)
            ]);
        }
        return this.loadEverythingPromise;
    }

    public get call(): string {
        return this._call;
    }

    public attachPlugins() {

    }
}
