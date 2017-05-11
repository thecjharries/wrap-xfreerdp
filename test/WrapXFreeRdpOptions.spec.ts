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

describe('WrapXFreeRdpOptions', () => {
    let options: WrapXFreeRdpOptions;

    beforeEach(() => {
        options = new WrapXFreeRdpOptions();
    });

    describe('.verifyAndReturnTarget()', () => {
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

    describe('.loadConfigFrom()', () => {
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

    // TODO: check the recursive parts
    describe('.copyAndOverwriteFromFirstToSecond()', () => {
        let first: WrapXFreeRdpFlags;
        let second: WrapXFreeRdpFlags;

        beforeEach(() => {
            first = { firstOnly: true, shared: true, target: 'first' };
            second = { shared: false, secondOnly: true, target: 'second' };
            second = options.copyAndOverwriteFromFirstToSecond(first, second);
        })

        it('should copy new properties over', () => {
            second.firstOnly.should.be.true;
        });

        it('should overwrite common properties', () => {
            second.shared.should.be.true;
            second.target.should.be.equal('first');
        })

        it('should ignore properties only in the second', () => {
            second.secondOnly.should.be.true;
        })
    });

    describe('.attachCliArgumentsToOptions()', () => {
        let argv: WrapXFreeRdpArguments;
        let flags: WrapXFreeRdpFlags;
        let copyStub: sinon.SinonStub;

        beforeEach(() => {
            argv = { firstOnly: true, shared: true, target: 'first', '_': [] };
            flags = { shared: false, secondOnly: true, target: 'second' };
            copyStub = sinon.stub(options, 'copyAndOverwriteFromFirstToSecond');
        })

        it('should call the copy method', () => {
            flags = options.attachCliArgumentsToFlags(argv, flags);
            copyStub.called.should.be.true;
        });

        afterEach(() => {
            (<sinon.SinonStub>options.copyAndOverwriteFromFirstToSecond).restore();
        })
    });

    describe('.loadConfig()', () => {
        let argv: WrapXFreeRdpArguments;
        let flags: WrapXFreeRdpFlags;
        let targetStub: sinon.SinonStub;
        let copyStub: sinon.SinonStub;
        let loadStub: sinon.SinonStub;

        beforeEach(() => {
            argv = { firstOnly: true, shared: true, target: 'first', '_': [] };
            flags = { shared: false, secondOnly: true, target: 'second' };
            targetStub = sinon
                .stub(options, 'verifyAndReturnTarget')
                .resolves('first');
            copyStub = sinon.stub(options, 'copyAndOverwriteFromFirstToSecond');
            copyStub.onCall(0).resolves({ local: true });

            copyStub.resolves({ local: false, specified: false, targeted: true });
            loadStub = sinon.stub(options, 'loadConfigFrom');
            loadStub.onCall(0).resolves({});
            loadStub.resolves({ local: false, specified: true });
        });

        it('should properly verify the target', () => {
            return options.loadConfig(argv).then(() => {
                targetStub.callCount.should.equal(1);
            });
        });

        describe('without user config', () => {
            it('should properly load', () => {
                return options.loadConfig(argv).then(() => {
                    loadStub.callCount.should.be.equal(2);
                });
            });

            describe('without target-specific config', () => {
                beforeEach(() => {
                    loadStub.onCall(1).resolves({ local: true });
                    copyStub.onCall(1).resolves({ local: false, specified: true })
                });

                it('should properly copy', () => {
                    return options.loadConfig(argv).then((returnedOptions: any) => {
                        copyStub.callCount.should.be.equal(1);
                        returnedOptions.should.be.deep.equal({ local: true });
                    });
                });
            });

            describe('with target-specific config', () => {
                beforeEach(() => {
                    loadStub.onCall(1).resolves({ local: true, first: { inner: true } });
                    copyStub.onCall(0).resolves({ local: true, first: { inner: true } })
                    copyStub.onCall(1).resolves({ local: false, specified: true, first: { inner: true } })
                });

                it('should properly copy', () => {
                    return options.loadConfig(argv).then((returnedOptions: any) => {
                        copyStub.callCount.should.be.equal(2);
                        returnedOptions.should.be.deep.equal({ local: false, specified: true, first: { inner: true } });
                    });
                });
            });
        });

        describe('with user config', () => {
            beforeEach(() => {
                argv = { firstOnly: true, shared: true, target: 'first', configFile: 'path', '_': [] };
            });

            it('should properly load', () => {
                return options.loadConfig(argv).then(() => {
                    loadStub.callCount.should.be.equal(3);
                });
            });

            describe('without target-specific config', () => {
                beforeEach(() => {
                    loadStub.onCall(1).resolves({ local: true });
                    copyStub.onCall(1).resolves({ local: false, specified: true })
                });

                it('should properly copy', () => {
                    return options.loadConfig(argv).then((returnedOptions: any) => {
                        copyStub.callCount.should.be.equal(2);
                        returnedOptions.should.be.deep.equal({ local: false, specified: true });
                    });
                });
            });

            describe('with target-specific config', () => {
                beforeEach(() => {
                    loadStub.onCall(1).resolves({ local: true, first: { inner: true } });
                    copyStub.onCall(1).resolves({ local: false, specified: true, first: { inner: true } })
                });

                it('should properly copy', () => {
                    return options.loadConfig(argv).then((returnedOptions: any) => {
                        copyStub.callCount.should.be.equal(3);
                        returnedOptions.should.be.deep.equal({ local: false, specified: false, targeted: true });
                    });
                });
            });
        });

        afterEach(() => {
            (<sinon.SinonStub>options.verifyAndReturnTarget).restore();
            (<sinon.SinonStub>options.copyAndOverwriteFromFirstToSecond).restore();
            (<sinon.SinonStub>options.loadConfigFrom).restore();
        });
    });

    describe('.loadAndAttachConfig()', () => {
        let argv: WrapXFreeRdpArguments;
        let loadStub: sinon.SinonStub;
        let attachStub: sinon.SinonStub;

        beforeEach(() => {
            argv = { firstOnly: true, shared: true, target: 'first', '_': [] };
            loadStub = sinon.stub(options, 'loadConfig');
            loadStub.resolves({ local: false, specified: true });
            attachStub = sinon.stub(options, 'attachCliArgumentsToFlags');
            attachStub.resolves({ local: false, specified: false, targeted: true });
        });

        it('should override loaded from attached', () => {
            return options.loadAndAttachConfig(argv).then((returnedOptions) => {
                returnedOptions.should.be.deep.equal({ local: false, specified: false, targeted: true });
                loadStub.callCount.should.be.equal(1);
                attachStub.callCount.should.be.equal(1);
            });
        });

        afterEach(() => {
            (<sinon.SinonStub>options.attachCliArgumentsToFlags).restore();
            (<sinon.SinonStub>options.loadConfig).restore();
        });
    });
});
