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

require('restrict');

var child_process = require('child_process');
try {
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
