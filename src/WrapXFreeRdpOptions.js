"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const fsp = require('fs-promise');
class WrapXFreeRdpOptions {
    constructor() {
        return this;
    }
    verifyAndReturnTarget(argv) {
        if (argv._.length < 1) {
            return Promise.reject('No target specified, exiting');
        }
        else if (argv._.length > 1) {
            return Promise.reject('Too many targets specified, exiting');
        }
        return Promise.resolve(argv._[0]);
    }
    loadConfigFrom(path, userSpecified) {
        return fsp
            .readJson(path)
            .then((contents) => {
            return contents;
        })
            .catch((error) => {
            if (userSpecified) {
                return Promise.reject(`Can't find ${path}, exiting`);
            }
            return {};
        });
    }
    copyAndOverwriteFromFirstToSecond(first, second) {
        for (let key in first) {
            if (first.hasOwnProperty(key)) {
                second[key] = first[key];
            }
        }
        return second;
    }
}
exports.WrapXFreeRdpOptions = WrapXFreeRdpOptions;
