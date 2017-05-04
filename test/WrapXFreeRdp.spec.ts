import * as chai from 'chai';
import * as sinon from 'sinon';
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
chai.use(require('chai-as-promised'));

import * as Promise from 'bluebird';
let fsp = require('fs-promise');

import { WrapXFreeRdpOptions } from '../src/WrapXFreeRdpOptions';

describe('WrapXFreeRdpOptions', () => {
    let options: WrapXFreeRdpOptions;

    beforeEach(() => {
        options = new WrapXFreeRdpOptions();
    });

    describe('verifyAndReturnTarget', () => {
        let target: Promise<string>;

        it('should verify and return a correct target', () => {
            target = options.verifyAndReturnTarget({ '_': ['testTarget'] });
            return target.should.eventually.be.equal('testTarget');
        });

        it('should fail a missing target', () => {
            target = options.verifyAndReturnTarget({ '_': [] });
            return target.should.be.rejected;
        });

        it('should fail multiple targets', () => {
            target = options.verifyAndReturnTarget({ '_': ['one', 'two'] });
            return target.should.be.rejected;
        });

    });

    describe('loadConfigFrom', () => {
        describe('with no specified config', () => {
            let userSpecified: boolean = false;

            it('should be empty when a file is empty', () => {
                sinon.stub(fsp, 'readJson').returns(Promise.resolve({}));
                return options
                    .loadConfigFrom('some-path', userSpecified)
                    .should.eventually.be.deep.equal({});
            });

            it('should be empty when a file is not found', () => {
                sinon.stub(fsp, 'readJson').returns(Promise.reject(''));
                return options
                    .loadConfigFrom('some-path', userSpecified)
                    .should.eventually.be.deep.equal({});
            });

        });

        describe('with specified config', () => {
            let userSpecified: boolean = true;

            it('should return values when available', () => {
                sinon.stub(fsp, 'readJson').returns(Promise.resolve({ 'g': '1440x900' }));
                return options
                    .loadConfigFrom('some-path', userSpecified)
                    .should.eventually.be.deep.equal({ 'g': '1440x900' });
            });

            it('should die when config is not found', () => {
                sinon.stub(fsp, 'readJson').returns(Promise.reject(''));
                return options
                    .loadConfigFrom('some-path', userSpecified)
                    .should.eventually.be.rejected;
            })
        });

        afterEach(() => {
            fsp.readJson.restore();
        });
    });
});
