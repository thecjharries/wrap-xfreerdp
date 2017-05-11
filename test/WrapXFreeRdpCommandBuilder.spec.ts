import * as chai from 'chai';
import * as sinon from 'sinon';
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
chai.use(require('chai-as-promised'));

import * as Promise from 'bluebird';
let fsp = require('fs-promise');


import { WrapXFreeRdpArguments } from '../src/interfaces/WrapXFreeRdpArguments';
import { WrapXFreeRdpFlags } from '../src/interfaces/WrapXFreeRdpFlags';

import { WrapXFreeRdpOptions } from '../src/WrapXFreeRdpOptions';
import { WrapXFreeRdpCommandBuilder } from '../src/WrapXFreeRdpCommandBuilder';

describe('WrapXFreeRdpCommandBuilder', () => {
    let argv = { firstOnly: true, shared: true, target: 'first', '_': ['a'] };
    let commandBuilder: WrapXFreeRdpCommandBuilder;
    let readJsonStub: sinon.SinonStub;

    beforeEach(() => {
        commandBuilder = new WrapXFreeRdpCommandBuilder(argv);
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

    describe('.loadValidators()', () => {
        it('should load proper json', () => {
            return commandBuilder.loadValidators().then((validators) => {
                readJsonStub.callCount.should.be.equal(1);
                validators.should.be.a('Array');
                validators.length.should.be.equal(3);
            });
        });

        it('should be a singleton', () => {
            return commandBuilder.loadValidators()
                .then(() => {
                    return commandBuilder.loadValidators();
                })
                .then((validators) => {
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

    });
});
