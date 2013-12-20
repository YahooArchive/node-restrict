/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var async = require('async'),
    child = require('child_process'),
    underscore = require('underscore');
    
var origBinding,
    whitelistCommands = [],
    whitelistPaths,
    whitelistCommandPaths = [],
    originalMethod;

/*
 * For each whitelist path, add this command
 * result is an array of full commands
 * eg
 * thisCommand = grep
 * whitelistPaths = ['/usr/local/bin', '/bin']
 * output
 *     ['/usr/loca/bin/grep',
 *     '/bin/grep']
 */
function getCommandPaths(thisCommand, callback) {
    async.concat(whitelistPaths, function (thisPath, thisCallback) {
        var commandPath = thisCommand;
        if (thisCommand && thisCommand.charAt(0) !== '/') {
            commandPath = thisPath + "/" + thisCommand;
        }
        thisCallback(null, commandPath);
    }, function (err, thisCommandPaths) {
        callback(null, thisCommandPaths);
    });
}

/*
 * Returns a function which throws the exception if not in whitelist
 * else does not alter behavior
 */
function permissionDenied(name, originalMethod) {
    return function () {

        var toCheckCommands = [],
            toCheckCommandPaths,
            intersection = [],
            self = this,
            thisarguments = arguments;

        // command could be in arguments[0] in case of exec
        // or arguments[1][1] in case of execFile
        toCheckCommands.push(thisarguments[0]);
        if (thisarguments.length >= 2) {
            toCheckCommands.push((thisarguments[1])[1]);
        }

        // for the command in action
        // generate a list of possible fully qualified commands possible, by appending whitelist paths
        async.concat(toCheckCommands, getCommandPaths, function (err, commandPathsAbs) {
            toCheckCommandPaths = commandPathsAbs;
            // Verify if any of them exists in the fully qualified whitelisted commands
            intersection = underscore.intersection(whitelistCommandPaths, toCheckCommandPaths);
            if (intersection && intersection.length > 0) {
                return originalMethod.apply(self, thisarguments);
            } else {
               throw new Error("Function call " + name + "() is prohibited in this environment.");
            }
        });
    };
}

/*
 * Restict the APIs to return permission denied exception
 * config: {
 *     whitelist: array of whitelist commands
 *     whitelistPath: array of whitelist paths where commands could reside
 * }
 */
function restrict(config) {

    origBinding = process.binding;
    whitelistCommands = config.whitelist ? config.whitelist : [];
    whitelistPaths = config.whitelistPath ? config.whitelistPath : '/usr/local/bin';

    // Make sure its an array
    whitelistPaths = whitelistPaths.isArray ? whitelistPaths : [whitelistPaths];

    // Generate a fully qualified whitelisted commands
    async.concat(whitelistCommands, getCommandPaths, function (err, whitelistAbs) {
        whitelistCommandPaths = whitelistAbs;
    });

    process.binding = function (name) {
        if (name === 'process_wrap') {
            throw new Error("Access to 'process_wrap' functionality is prohibited in this environment.");
        } else {
            return origBinding.call(process, name);
        }
    };

    // For each of the methods in child_process
    // Verify if command is in whitelist
    // If not, throw an exception
    for (var fn in child) {
        if (child.hasOwnProperty(fn)) {
            originalMethod = child[fn];
            child[fn] = permissionDenied(fn, originalMethod);
        }
    }

    // prohibit kill
    process.kill = function () {
        var name = 'process.kill';
        throw new Error("Function call " + name + "() is prohibited in this environment.");
    };
}

module.exports = restrict;
