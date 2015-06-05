/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var vows = require('vows'),
    assert = require('assert');

var restrict = require('..');
// Add ls to whitelist
restrict({
    'whitelist': ['ls', 'foo.bar'],
    'whitelistPath': ['/bin', '/usr/bin']
});

//vows hack to print uncaught exceptions
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err.stack);
});

var tests = {
    
    'testing restrict child_process methods': {
        topic: function () {
	    var self = this;
	    try {
		require('child_process').spawn('grep',['BLA', './*']);
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
    'testing restrict child_process methods whitelist': {
        topic: function () {
	    var self = this;
	    try {
		require('child_process').exec('ls',['-ltr']);
                self.callback(null, {});
	    } catch (e) {
		self.callback(null, {
		    'error': e
		});
	    }
	},
	'verify error': function (topic) {
	    assert.ok(topic.error === undefined);
	}
    },
    'testing restrict child_process methods relative whitelist': {
	
        topic: function () {
	    var self = this;
	    try {
		require('child_process').exec('xyz/foo.bar',['-ltr']);
		require('child_process').exec('./foo.bar',['-ltr']);
		require('child_process').exec('../foo.bar',['-ltr']);
		require('child_process').exec('./tmp/foo.bar',['-ltr']);
		require('child_process').exec('foo.bar',['-ltr']);
                self.callback(null, {});
	    } catch (e) {
		self.callback(null, {
		    'error': e
		});
	    }
            
	},
	'verify error': function (topic) {
	    assert.ok(topic.error === undefined);
	}
    },    
    'testing restrict child_process methods whitelist absolute': {
        topic: function () {
	    var self = this;
	    try {
		require('child_process').exec('/bin/ls',['-ltr']);
                self.callback(null, {});
	    } catch (e) {
		self.callback(null, {
		    'error': e
		});
	    }
            
	},
	'verify error': function (topic) {
	    assert.ok(topic.error === undefined);
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
	    assert.ok(topic.error === undefined);
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
	    assert.ok(topic.error === undefined);
	}
    },
    'testing restrict with setWhitelist child_process methods whitelist with not whitelist path': {
        topic: function () {
	    var self = this;
	    try {
		restrict.setWhitelist(['grep'], ['/bin', '/usr/bin']);
		require('child_process').spawn('/usr/bin64/grep',['BLA', './*']);
		self.callback(null, {});
	    } catch (e) {
		self.callback(null, {
		    'error': e
		});
	    }
	},
	'verify error': function (topic) {
	    assert.ok(topic.error);
	}
    },
    'testing restrict with setWhitelist child_process methods non-whitelist': {
        topic: function () {
	    var self = this;
	    try {
		restrict.setWhitelist(['grep'], ['/bin', '/usr/bin']);    
		require('child_process').exec('ls',['-ltr']);
                self.callback(null, {});
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
    'testing restrict with setWhitelist with not arguments child_process methods non-whitelist': {
        topic: function () {
	    var self = this;
	    try {
		restrict.setWhitelist();
	    } catch(e) {
		self.callback(null, {
		    'error1': e
		});
	    }
	    try {
		require('child_process').exec('ls',['-ltr']);
                self.callback(null, {});
	    } catch (e) {
		self.callback(null, {
		    'error2': e
		});
	    }
	},
	'verify error': function (topic) {
	    assert.ok(topic.error1 === undefined);
	    assert.ok(topic.error2 !== null);
	}
    },

}
vows.describe('restrict').addBatch(tests).addBatch(tests_next).export(module);
