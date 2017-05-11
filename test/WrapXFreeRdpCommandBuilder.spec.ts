import * as chai from 'chai';
import * as sinon from 'sinon';
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
chai.use(require('chai-as-promised'));

import * as Promise from 'bluebird';
let fsp = require('fs-promise');

// Interfaces
import { WrapXFreeRdpArguments } from '../src/interfaces/WrapXFreeRdpArguments';
import { WrapXFreeRdpFlags } from '../src/interfaces/WrapXFreeRdpFlags';
import { WrapXFreeRdpValidator } from '../src/interfaces/WrapXFreeRdpValidator';
// Classes
import { WrapXFreeRdpOptions } from '../src/WrapXFreeRdpOptions';
import { WrapXFreeRdpCommandBuilder } from '../src/WrapXFreeRdpCommandBuilder';

describe('WrapXFreeRdpCommandBuilder', () => {
    let argv: WrapXFreeRdpArguments;
    let commandBuilder: WrapXFreeRdpCommandBuilder;

    beforeEach(() => {
        argv = { firstOnly: true, shared: true, target: 'first', '_': ['a'] };
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
                    { longhand: 'geometry', regex: '^["\']?\\d+x\\d+["\']?$' }
                ]
            );
            readJsonStub.resolves([]);
        });

        it('should load proper validators', () => {
            return commandBuilder.loadValidators().then((validators: Array<WrapXFreeRdpValidator>) => {
                readJsonStub.callCount.should.be.equal(1);
                validators.should.be.a('Array');
                validators.length.should.be.equal(3);
                for (let validator of validators) {
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
                .then((validators: Array<WrapXFreeRdpValidator>) => {
                    readJsonStub.callCount.should.be.equal(1);
                    validators.should.be.a('Array');
                    validators.length.should.be.equal(3);
                })
        });

        afterEach(() => {
            (<sinon.SinonStub>fsp.readJson).restore();
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
                    { longhand: 'geometry', regex: '^["\']?\\d+x\\d+["\']?$' }
                ]
            );
            readJsonStub.resolves([]);
            loadAndAttachConfigStub = sinon.stub(WrapXFreeRdpOptions.prototype, 'loadAndAttachConfig').resolves({loaded: true});
        });

        it('should be a singleton', () => {
            return commandBuilder.loadEverything()
                .then(() => {
                    return commandBuilder.loadEverything();
                })
                .then((everything: Array<any>) => {
                    readJsonStub.callCount.should.be.equal(1);
                    everything.should.be.a('Array');
                    everything.length.should.be.equal(2);
                    everything[0].should.be.a('Array');
                    everything[0].length.should.be.equal(3);
                    everything[1].should.be.deep.equal({loaded: true});
                })
        });

        afterEach(() => {
            (<sinon.SinonStub>WrapXFreeRdpOptions.prototype.loadAndAttachConfig).restore();
        });

        afterEach(() => {
            (<sinon.SinonStub>fsp.readJson).restore();
        });
    });

    describe('get call()', () => {
        it('should return default when nothing has been set', () => {
            commandBuilder.call.should.be.equal('xfreerdp');
        })
    });

    describe('.attachPlugins()', () => {
        it('should do nothing with no plugins', () => {
            commandBuilder.attachPlugins();
        });
    });
});
