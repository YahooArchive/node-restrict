/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var child_process = require('child_process'),
    restrict = require('./lib/index.js');

// Try whitelist
restrict({
    'whitelist': ['ls', 'ps'],
    'whitelistPath': '/bin'
});

try {
    child_process.exec('ls', function (err, stdout, stderr) {
        console.log(stdout);
    });
} catch (e) {
    console.log(e);
}
