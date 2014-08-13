/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var child = require('child_process'),
    path = require('path'),
    whitelist;

function isAbsolutePath(command) {
   return command.charAt(0) === path.sep;
}

/*
 * For each whitelist path, add these commands
 * result is an array of full commands
 * eg
 * commands = [grep]
 * whitelistPaths = ['/usr/local/bin', '/bin']
 * output
 *     ['/usr/loca/bin/grep',
 *     '/bin/grep']
 */
function getPathCombinations(commands, paths) {
    var arrayedPaths = [],
        pathCombinations = [];
    
    arrayedPaths = commands.map(function(thisCommand) {
        return paths.map(function(thisPath) {
            if (thisCommand &&
                typeof thisCommand === 'string'
                && isAbsolutePath(thisCommand)) {
                return thisCommand;
            } else {
                return path.join(thisPath, thisCommand);
            }
        });
    });
    pathCombinations =
        pathCombinations.concat.apply(pathCombinations, arrayedPaths);
    return pathCombinations;
}


function Whitelist() {
    this.commands = [];
    this.commandPaths = [];
}

Whitelist.prototype.set = function(commands, paths) {
    this.commands = commands || [];
    paths = paths || '/usr/local/bin';
    paths = (paths instanceof Array) ? paths : [paths];
    this.commandPaths = getPathCombinations(commands, paths);
};

whitelist = new Whitelist();


/*
 * Returns a function which throws the exception if not in whitelist
 * else does not alter behavior
 */
function permissionDenied(name, originalMethod) {
    return function () {

        var toCheckCommands = [],
            found = false,
            i = 0;

        // command could be in arguments[0] in case of exec
        // or arguments[1][1] in case of execFile
        toCheckCommands.push(arguments[0]);
        if (arguments.length >= 2 && (arguments[1])[1]) {
            toCheckCommands.push((arguments[1])[1]);
        }

        for (i = 0; i < toCheckCommands.length; i++) {
            if (isAbsolutePath(toCheckCommands[i])) {
                if (whitelist.commandPaths.indexOf(toCheckCommands[i]) >= 0) {
                    found = true;
                    break;
                }
            } else {
                //relative path
                if (whitelist.commands.indexOf(path.basename(toCheckCommands[i])) >= 0) {
                    found = true;
                    break;
                }
            }
        }
        if (found) {
            return originalMethod.apply(this, arguments);
        } else {
            throw new Error("Function call " + name + "() is prohibited in this environment.");
        }
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

    var origBinding,
        originalMethod,
        fn;
    
    origBinding = process.binding;
        
    whitelist.set(config.whitelist, config.whitelistPath);

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
    for (fn in child) {
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
module.exports.setWhitelist = function() {
    whitelist.set(arguments);
};
