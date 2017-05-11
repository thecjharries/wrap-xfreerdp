import * as Promise from 'bluebird';
import * as chai from 'chai';
import * as sinon from 'sinon';

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
/* tslint:disable-next-line:no-var-requires */
chai.use(require('chai-as-promised'));

/* tslint:disable-next-line:no-var-requires */
const fsp = require('fs-promise');

// Interfaces
import { IWrapXFreeRdpArguments } from '../src/interfaces/IWrapXFreeRdpArguments';
import { IWrapXFreeRdpFlags } from '../src/interfaces/IWrapXFreeRdpFlags';
import { IWrapXFreeRdpValidator } from '../src/interfaces/IWrapXFreeRdpValidator';
// Classes
import { WrapXFreeRdpCommandBuilder } from '../src/WrapXFreeRdpCommandBuilder';
import { WrapXFreeRdpOptions } from '../src/WrapXFreeRdpOptions';

describe('WrapXFreeRdpCommandBuilder', () => {
    let argv: IWrapXFreeRdpArguments;
    let commandBuilder: WrapXFreeRdpCommandBuilder;

    beforeEach(() => {
        argv = { firstOnly: true, shared: true, target: 'first', _: ['a'] };
        commandBuilder = new WrapXFreeRdpCommandBuilder(argv);
    });



    // TODO: split out validator validation
    describe('.loadValidators()', () => {
        let readJsonStub: sinon.SinonStub;

        beforeEach(() => {
            readJsonStub = sinon.stub(fsp, 'readJson');
            readJsonStub.onCall(0).resolves(
                [
                    { longhand: 'user', regex: '^["\']?[\\w\\-]+["\']?$' },
                    { longhand: 'domain', regex: '^["\']?[\\w\\-]+["\']?$' },
                    { longhand: 'geometry', regex: '^["\']?\\d+x\\d+["\']?$' },
                ],
            );
            readJsonStub.resolves([]);
        });

        it('should load proper validators', () => {
            return commandBuilder.loadValidators().then((validators: IWrapXFreeRdpValidator[]) => {
                readJsonStub.callCount.should.be.equal(1);
                validators.should.be.a('Array');
                validators.length.should.be.equal(3);
                for (const validator of validators) {
                    validator.should.be.a('object');
                    validator.should.have.property('longhand');
                    validator.should.have.property('regex');
                }
            });
        });

        it('should be a singleton', () => {
            return commandBuilder.loadValidators()
                .then(() => {
                    return commandBuilder.loadValidators();
                })
                .then((validators: IWrapXFreeRdpValidator[]) => {
                    readJsonStub.callCount.should.be.equal(1);
                    validators.should.be.a('Array');
                    validators.length.should.be.equal(3);
                });
        });

        afterEach(() => {
            (fsp.readJson as sinon.SinonStub).restore();
        });
    });

    describe('.loadEverything()', () => {
        let readJsonStub: sinon.SinonStub;
        let loadAndAttachConfigStub: sinon.SinonStub;

        beforeEach(() => {
            readJsonStub = sinon.stub(fsp, 'readJson');
            readJsonStub.onCall(0).resolves(
                [
                    { longhand: 'user', regex: '^["\']?[\\w\\-]+["\']?$' },
                    { longhand: 'domain', regex: '^["\']?[\\w\\-]+["\']?$' },
                    { longhand: 'geometry', regex: '^["\']?\\d+x\\d+["\']?$' },
                ],
            );
            readJsonStub.resolves([]);
            loadAndAttachConfigStub = sinon.stub(
                WrapXFreeRdpOptions.prototype,
                /* tslint:disable-next-line:trailing-comma */
                'loadAndAttachConfig'
            )
                .resolves({ loaded: true });
        });

        it('should be a singleton', () => {
            return commandBuilder.loadEverything()
                .then(() => {
                    return commandBuilder.loadEverything();
                })
                .then((everything: any[]) => {
                    readJsonStub.callCount.should.be.equal(1);
                    everything.should.be.a('Array');
                    everything.length.should.be.equal(2);
                    everything[0].should.be.a('Array');
                    everything[0].length.should.be.equal(3);
                    everything[1].should.be.deep.equal({ loaded: true });
                });
        });

        afterEach(() => {
            (WrapXFreeRdpOptions.prototype.loadAndAttachConfig as sinon.SinonStub).restore();
        });

        afterEach(() => {
            (fsp.readJson as sinon.SinonStub).restore();
        });
    });

    describe('.attachPlugins()', () => {
        // TODO: remove any cast on @types/sinon update
        let flagsStub: sinon.SinonStub | any;

        beforeEach(() => {
            // TODO: remove any cast on @types/sinon update
            flagsStub = (sinon.stub(WrapXFreeRdpOptions.prototype, 'flags') as any);
        });

        it('should do nothing with no plugins', () => {
            flagsStub.get(() => {
                return {};
            });
            commandBuilder.attachPlugins();
            commandBuilder.call.should.be.equal('xfreerdp');
            flagsStub.get(() => {
                const retVal: any = {};
                retVal.plugins = [];
                return retVal;
            });
            commandBuilder.attachPlugins();
            commandBuilder.call.should.be.equal('xfreerdp');

        });

        it('should attach an array of plugin', () => {
            flagsStub.get(() => {
                return { plugins: ['cliprdr', 'cliprdr2'] };
            });
            commandBuilder.attachPlugins();
            commandBuilder.call.should.be.equal('xfreerdp --plugin cliprdr --plugin cliprdr2');
        });

        afterEach(() => {
            flagsStub.restore();
        });
    });

    describe('get call()', () => {
        it('should return default when nothing has been set', () => {
            commandBuilder.call.should.be.equal('xfreerdp');
        });
    });
});
