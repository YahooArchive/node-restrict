/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var child = require('child_process');


/*
 * Append default path if the command does not have a full path
 */
function getAbsolutePath(command, defaultPath) {
    if (command.charAt(0) !== '/') {
        return defaultPath + '/' + command;
    }
    return command;
}

/*
 * Returns a function which throws the exception.
 */
function permissionDenied(name, originalMethod, whitelistPath, whitelist) {
    return function () {
        if (whitelist.indexOf(getAbsolutePath(arguments[0], whitelistPath)) >= 0) {
             return originalMethod.apply(this, arguments);
        } else if (arguments.length >= 2
            && whitelist.indexOf(getAbsolutePath((arguments[1])[1],whitelistPath)) >= 0) {
             return originalMethod.apply(this, arguments);
        } else {
             throw new Error("Function call " + name + "() is prohibited in this environment.");
        }
    };
}

/*
 * Restict the APIs to return permission denied exception
 */
function restrict(config) {

    var origBinding = process.binding,
        fn,
        whitelist = config.whitelist ? config.whitelist : [],
        whitelistPath = config.whitelistPath ? config.whitelistPath : '/usr/local/bin',
        whitelistAbs = whitelist.map(function(single) {
            return whitelistPath + "/" + single;
        }),
        originalMethod;

    process.binding = function (name) {
        if (name === 'process_wrap') {
            throw new Error("Access to 'process_wrap' functionality is prohibited in this environment.");
        } else {
            return origBinding.call(process, name);
        }
    };

    for (fn in child) {
        if (child.hasOwnProperty(fn)) {
            originalMethod = child[fn];
            child[fn] = permissionDenied(fn, originalMethod, whitelistPath, whitelistAbs);
        }
    }

    // prohibit kill
    process.kill = permissionDenied('process.kill');
}

module.exports = restrict;
