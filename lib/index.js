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
    this.commandPaths = getPathCombinations(this.commands, paths);
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
        // or arguments[1][1] in case of execFile for node v0.10
        toCheckCommands.push(arguments[0].split(/\s+/)[0]);
        if (arguments.length >= 2 && arguments[1][1]) {
            toCheckCommands.push(arguments[1][1].split(/\s+/)[0]);
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

function restrictBinding(name, func) {
    var origFunc = func;
    process[name] = function(name) {
        if (name === 'process_wrap') {
            throw new Error("Access to 'process_wrap' functionality is prohibited in this environment.");
        } else {
            return origFunc.call(process, name);
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
    var originalMethod,
        fn;

    whitelist.set(config.whitelist, config.whitelistPath);

    restrictBinding('binding', process.binding);
    if (process._linkedBinding) {
        //_linkedBinding is defined from v0.12
        restrictBinding('_linkedBinding', process._linkedBinding);    
    }
    

    // For each of the methods in child_process
    // Verify if command is in whitelist
    // If not, throw an exception
    for (fn in child) {
        if (child.hasOwnProperty(fn)) {
            originalMethod = child[fn];
            child[fn] = permissionDenied(fn, originalMethod);
        }
    }

    // prohibit kill & _kill
    process._kill = process.kill = function () {
        throw new Error("Function call process.kill() and process._kill() is prohibited in this environment.");
    };

}

module.exports = restrict;
module.exports.setWhitelist = function(commands, paths) {
    whitelist.set(commands, paths);
};
