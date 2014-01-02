# restrict

Nodejs module that blocks applications from using procss.binding('process_wrap'), process.kill and child_process methods.
This protects applications from invoking these methods unintentionally, that could harm the functioning of the framework or application being developed.

This package is tested only with Node versions 8 and 10.

# install

With [npm](http://npmjs.org) do:

```
npm install restrict
```

# usage
```js

var restrict = require('restrict');
// ls is whitelisted
restrict({
    'whitelist': ['ls'],
    'whitelistPath': ['/bin']
});

var child_process = require('child_process');
try {
    // ls is whitelisted. So you can see the output of ls
    child_process.exec('/bin/ls', function (err, stdout, stderr) {
        console.log(stdout);
    });
    // grep is not whitelisted. Exception thrown
    child_process.spawn('grep', ['ssh']);
} catch (e) {
    //this will throw an error
    //[Error: Function call spawn() is prohibited in this environment.]
    console.log(e);
}
try {
    process.kill(30);
} catch (e) {
    //this will throw an error
    //[Error: Function call process.kill() is prohibited in this environment.]
    console.log(e);
}
```
# Build Status

[![Build Status](https://secure.travis-ci.org/yahoo/node-restrict.png?branch=master)](http://travis-ci.org/yahoo/node-restrict)

# Node Badge

[![NPM](https://nodei.co/npm/restrict.png)](https://nodei.co/npm/restrict/)
