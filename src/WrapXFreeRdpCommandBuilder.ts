import * as Promise from 'bluebird';
const fsp = require('fs-promise');
import * as path from 'path';
import { WrapXFreeRdpArguments } from './interfaces/WrapXFreeRdpArguments';
import { WrapXFreeRdpFlags } from './interfaces/WrapXFreeRdpFlags';
import { WrapXFreeRdpOptions } from './WrapXFreeRdpOptions';

export class WrapXFreeRdpCommandBuilder {
    private options: WrapXFreeRdpOptions;
    private JSON_LOCATION: string = path.join(__dirname, 'config/flags-and-regex.json');
    private validators: Promise<any> = null;
    private loadEverythingPromise: Promise<Array<any>> = null;
    private argv: WrapXFreeRdpArguments

    public constructor(argv: WrapXFreeRdpArguments) {
        this.options = new WrapXFreeRdpOptions();
        this.argv = argv;
        this.loadEverything(argv);
    }

    public loadValidators(): Promise<any> {
        if (this.validators === null) {
            this.validators = fsp.readJson(this.JSON_LOCATION);
        }
        return this.validators;
    }

    public loadEverything(argv: WrapXFreeRdpArguments): Promise<Array<any>> {
        if (this.loadEverythingPromise === null) {
            this.loadEverythingPromise = Promise.all([
                this.loadValidators(),
                this.options.loadAndAttachConfig(argv)
            ]);
        }
        return this.loadEverythingPromise;
    }



}
