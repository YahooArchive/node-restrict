/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var child = require('child_process');

/*
 * Returns a function which throws the exception.
 */
function permissionDenied(name, originalMethod, whitelist) {
    return function () {
        if (whitelist.indexOf(arguments[0]) >= 0 || whitelist.indexOf((arguments[1])[1]) >= 0) {
             return originalMethod.apply(this, arguments);
        } else {
             throw new Error("Function call " + name + "() is prohibited in this environment.");
        }
    };
}

/*
 * Restict the APIs to return permission denied exception
 */
function restrict(whitelist) {

    var origBinding = process.binding,
        fn,
        _whitelist = whitelist ? whitelist : [],
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
            child[fn] = permissionDenied(fn, originalMethod, _whitelist);
        }
    }

    // prohibit kill
    process.kill = permissionDenied('process.kill');
}

module.exports = restrict;
