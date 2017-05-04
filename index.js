// TODO: parse configs per server

const Promise = require('bluebird');
const childProcess = require('child_process');
const fsp = require('fs-promise');

function die(code = 0) {
    process.exit(code);
}

function errorAndDie(message) {
    console.log(message);
    die(1);
}

function verifyConfig(argv) {

}

function genericConfig() {
    // TODO: implement
    return {};
}

function verifyAndReturnTarget(argv) {
    if (argv._.length < 1) {
        return errorAndDie('No target specified, exiting');
    } else if (argv._.length > 1) {
        return errorAndDie('Too many targets specified, exiting');
    }
    return argv._[0];
}

function loadConfigFrom(path, userSpecified) {
    return fsp.readJson(path, 'utf8')
        .then((contents) => {
            return contents;
        })
        .catch((error) => {
            if (userSpecified) {
                errorAndDie(`Can't find ${path}, exiting`);
            }
            return {};
        });
}

function attachArgumentsToOptions(argv, options) {
    delete argv._;
    delete argv.configFile;
    return copyAndOverwriteFromFirstToSecond(argv, options);
}

function copyAndOverwriteFromFirstToSecond(first, second) {
    for (let key in first) {
        if (first.hasOwnProperty(key)) {
            second[key] = first[key];
        }
    }
    return second;
}

function loadConfig(argv) {
    let target = verifyAndReturnTarget(argv);
    let config = './.wrapxfreerdprc';
    let globalConfig = '~/.wrapxfreerdprc';
    let passInConfig = false;
    if (argv.configFile) {
        passInConfig = true;
        config = argv.configFile;
    }
    return Promise.resolve(genericConfig())
        .then((genericOptions) => {
            return loadConfigFrom(globalConfig, false)
                .then((globalOptions) => {
                    return copyAndOverwriteFromFirstToSecond(globalOptions, genericOptions);
                })
                .then((options) => {
                    if (options[target]) {
                        return copyAndOverwriteFromFirstToSecond(options[target], options);
                    }
                    return options;
                });
        })
        .then((options) => {
            return loadConfigFrom(config, passInConfig)
                .then((localOptions) => {
                    return copyAndOverwriteFromFirstToSecond(localOptions, options);
                })
                .then((options) => {
                    if (options[target]) {
                        return copyAndOverwriteFromFirstToSecond(options[target], options);
                    }
                    return options;
                });
        })
        .then((options) => {
            return attachArgumentsToOptions(argv, options);
        })
        .then((options) => {
            options.target = target;
            return options;
        });
}

function attachGeneric(call, options) {
    return fsp.readJson('./flags-and-regex.json', 'utf8')
        .then((flags) => {
            for (let flag of flags) {
                if (typeof flag.shorthand === 'undefined') {
                    flag.shorthand = flag.longhand.charAt(0);
                }
                if (options[flag.shorthand] || options[flag.longhand]) {
                    let option = options[flag.shorthand] ? options[flag.shorthand] : options[flag.longhand];
                    if ((new RegExp(flag.regex, 'i')).test(option)) {
                        call += ` -${flag.shorthand} ${option}`;
                    } else {
                        console.log(new RegExp(flag.regex));
                        errorAndDie(`Invalid ${flag.longhand}: '${option}', exiting`);
                    }
                }
            }
            return call;
        });
}

// TODO: add plugin options
function attachPlugins(call, options) {
    if (options.plugins) {
        let retVal = call;
        for (let plugin of options.plugins) {
            retVal += ` --plugin ${plugin}`;
        }
        return Promise.resolve(retVal);
    }
    return Promise.resolve(call);
}

function attachTarget(call, options) {
    return Promise.resolve(`${call} ${options.target}`);
}

function parseOpts(options) {
    return attachPlugins('xfreerdp', options)
        .then((call) => {
            return attachGeneric(call, options);
        })
        .then((call) => {
            return attachTarget(call, options);
        });
}

let argv = require('minimist')(process.argv.slice(2));

loadConfig(argv)
    .then((options) => {
        return parseOpts(options);
    })
    .then(console.log);
// .then(childProcess.exec);
