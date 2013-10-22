/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var child = require('child_process');

/*
 * Returns a function which throws the exception.
 */
function permissionDenied(name) {
    return function () {
        throw new Error("Function call " + name + "() is prohibited in this environment.");
    };
}

/*
 * Restict the APIs to return permission denied exception
 */
function restrict() {

    var origBinding = process.binding,
        fn;

    process.binding = function (name) {
        if (name === 'process_wrap') {
            throw new Error("Access to 'process_wrap' functionality is prohibited in this environment.");
        } else {
            return origBinding.call(process, name);
        }
    };

    // restrict the functionality on the module itself
    for (fn in child) {
        if (child.hasOwnProperty(fn)) {
            child[fn] = permissionDenied(fn);
        }
    }

    // prohibit kill
    process.kill = permissionDenied('process.kill');
}

module.exports = restrict();
