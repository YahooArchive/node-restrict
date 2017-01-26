/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var vows = require('vows'),
    assert = require('assert');

var restrict = require('..');
var errorMessage = "Function call [[command]] is prohibited in this environment.";
// Add ls to whitelist
restrict({
    'whitelist': ['ls', 'foo.bar', 'hello.js', '/usr/bin/who'],
    'whitelistPath': ['/bin', '/usr/bin']
});

//vows hack to print uncaught exceptions
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err.stack);
});

var tests = {

    'testing restrict child_process methods using spawn': {
        topic: function () {
            var self = this;
            var command = 'grep';
            try {
                require('child_process').spawn(command,['BLA', './*']);
            } catch (e) {
                self.callback(null, {
                    'error': e,
                    'command': command
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
            assert.equal(topic.error.message, errorMessage.replace("[[command]]", topic.command));
        }
    },
    'testing restrict child_process methods using exec': {
        topic: function () {
            var self = this;
            try {
                require('child_process').exec('grep foo package.json');
            } catch (e) {
                self.callback(null, {
                    'error': e,
                    'command': 'grep'
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
            assert.equal(topic.error.message, errorMessage.replace("[[command]]", topic.command));
        }
    },

    'testing restrict child_process methods using fork': {
        topic: function () {
            var self = this;
            var command = 'grep';
            try {
                require('child_process').fork(command,['BLA', './*']);
            } catch (e) {
                self.callback(null, {
                    'error': e,
                    'command': command
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
            assert.equal(topic.error.message, errorMessage.replace("[[command]]", topic.command));
        }
    },

    'testing restrict child_process methods using execFile': {
        topic: function () {
            var self = this;
            var command = 'who';
            try {
                require('child_process').execFile(command,['BLA', './*']);
            } catch (e) {
                self.callback(null, {
                    'error': e,
                    'command': command
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
            assert.equal(topic.error.message, errorMessage.replace("[[command]]", topic.command));
        }
    },

    'testing restrict child_process methods for commands which are whitelisted': {
        topic: function () {
            var self = this;
            try {
                require('child_process').exec('ls');
                require('child_process').exec('ls -l /tmp');
                require('child_process').spawn('ls', ['-lh', '/usr']);
                require('child_process').execFile('ls', ['-lh', '/usr']);
                require('child_process').fork('tests/fixtures/hello.js', ['--version']);
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.isUndefined(topic.error);
        }
    },
    'testing restrict child_process methods  for commands which are whitelisted with relative path': {

        topic: function () {
            var self = this;
            try {
                ['foo.bar', './foo.bar', '../foo.bar', 'xyz/foo.bar'].forEach(function(cmd) {
                    require('child_process').exec(cmd + ' -arg1');
                    require('child_process').spawn(cmd,['-arg1']);
                    require('child_process').execFile(cmd,['-arg1']);
                });
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }

        },
        'verify error': function (topic) {
            assert.isUndefined(topic.error);
        }
    },
    'testing restrict child_process methods for commands which are whitelisted with absolute path': {
        topic: function () {
            var self = this;
            try {
                ['/bin/ls', '/usr/bin/who'].forEach(function(cmd) {
                    require('child_process').exec(cmd + ' -ltr');
                    require('child_process').spawn(cmd,['-ltr']);
                    require('child_process').execFile(cmd,['-ltr']);
                });
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }

        },

        'verify error': function (topic) {
            assert.isUndefined(topic.error);
        }
    },
    'testing restrict kill method': {
        topic: function () {
            var self = this;
            try {
                process.kill(30);
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
        }
    },
    'testing restrict _kill method': {
        topic: function () {
            var self = this;
            try {
                process._kill(process.pid, 30);
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
        }
    },
    'testing restrict process_wrap method': {
        topic: function () {
            var self = this;
            try {
                process.binding('process_wrap');
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
        }
    },
    'testing restrict _linkedBinding for process_wrap method': {
        topic: function () {
            var self = this;
            try {
                (process._linkedBinding && process._linkedBinding('process_wrap')) || process.binding('process_wrap');
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error !== null);
        }
    },
    'testing restrict other binding method': {
        topic: function () {
            var self = this;
            try {
                process.binding('timer_wrap');
                process._linkedBinding && process._linkedBinding('timer_wrap')
                self.callback(null, {
                    error: null
                });
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error === null);
        }
    },
    'testing restrict other process methods': {
        topic: function () {
            var self = this;
            try {
                var memoryUsage = process.memoryUsage();
                self.callback(null, {
                    'error': null,
                    'output': memoryUsage
                });
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error === null);
        }
    }
}

var tests_next = {
        'testing restrict with setWhitelist child_process methods whitelist': {
        topic: function () {
            var self = this;
            try {
                restrict.setWhitelist(['grep'], ['/bin', '/usr/bin']);
                require('child_process').spawn('grep',['BLA', './*']);
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.isUndefined(topic.error);
        }
    },
    'testing restrict with setWhitelist child_process methods whitelist with full path': {
        topic: function () {
            var self = this;
            try {
                restrict.setWhitelist(['ls'], ['/bin', '/usr/bin']);
                require('child_process').spawn('/bin/ls', ['-lh', '/usr']);
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error': e
                });
            }
        },
        'verify error': function (topic) {
            assert.isUndefined(topic.error);
        }
    },
    'testing restrict with setWhitelist child_process methods whitelist with not whitelist path': {
        topic: function () {
            var self = this;
            var command = '/usr/bin64/grep';
            try {
                restrict.setWhitelist(['grep'], ['/bin', '/usr/bin']);
                require('child_process').spawn(command,['BLA', './*']);
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error': e,
                    'command' : command
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error);
            assert.equal(topic.error.message, errorMessage.replace("[[command]]", topic.command));
        }
    },
    'testing restrict with setWhitelist child_process methods non-whitelist': {
        topic: function () {
            var self = this;
            var command = 'ls';
            try {
                restrict.setWhitelist(['grep'], ['/bin', '/usr/bin']);
                require('child_process').exec(command,['-ltr']);
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error': e,
                    'command': command
                });
            }
        },
        'verify error': function (topic) {
            assert.ok(topic.error);
            assert.equal(topic.error.message, errorMessage.replace("[[command]]", topic.command));

        }
    },
    'testing restrict with setWhitelist with not arguments child_process methods non-whitelist': {
        topic: function () {
            var self = this;
            var command = 'ls';
            try {
                restrict.setWhitelist();
            } catch(e) {
                self.callback(null, {
                    'error1': e
                });
            }
            try {
                require('child_process').exec(command,['-ltr']);
                self.callback(null, {});
            } catch (e) {
                self.callback(null, {
                    'error2': e,
                    'command': command
                });
            }
        },
        'verify error': function (topic) {
            assert.isUndefined(topic.error1);
            assert.ok(topic.error2);
            assert.equal(topic.error2.message, errorMessage.replace("[[command]]", topic.command));
        }
    },

}
vows.describe('restrict').addBatch(tests).addBatch(tests_next).export(module);
