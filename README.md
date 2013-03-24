[![Build Status](https://travis-ci.org/75lb/handbrake-js.png?branch=master)](https://travis-ci.org/75lb/handbrake-js)
handbrake-js
============
A cross-platform npm distribution for [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide) designed for command line or library use.

As a library
============
Install
-------
```sh
$ npm install handbrake-js
```

Usage
-----
Handbrake-js has a single method: `run`. There are two ways to invoke it.

###handbrake.run(handbrakeOptions)
Returns an EventEmitter enabling you to catch [events](http://75lb.github.com/handbrake-js/classes/HandbrakeProcess.html) as they happen.
```javascript
var handbrake = require("handbrake-js");
    
var options = {
    input: "Eight Miles High.mov",
    output: "Eight Miles High.m4v",
    preset: "Normal"
};

handbrake.run(options)
    .on("output", console.log);
    .on("progress", function(encode){
        console.log(encode.percentComplete);
    })
    .on("complete", function(){ 
        console.log("Encode complete"); 
    });
```
### handbrake.run(handbrakeOptions, onComplete)
The second method is to pass an `onComplete` callback. It's more convenient for short duration tasks: 
```javascript
handbrake.run({ preset-list: true }, function(stdout, stderr){
    console.log(stdout);
});
```
As a command line tool
======================
Install
-------
```sh
$ sudo npm install -g handbrake-js
```
Usage
-----
Call `handbrake-js` as you would HandbrakeCLI, using all the usual [options](https://trac.handbrake.fr/wiki/CLIGuide):
```sh
$ handbrake-js --input "Ballroom Bangra.avi" --output "Ballroom Bangra.mp4" --preset Normal
```

HandbrakeCLI installation
=========================
On **Windows** and **Mac OSX** installing handbrake-js automatically installs the correct HandbrakeCLI binary for your platform. **Ubuntu** users should additionally run:
```sh
$ sudo npm -g run-script handbrake-js ubuntu-setup
```

Documentation
=============
For more detail on handbrake-js, see the [API docs](http://75lb.github.com/handbrake-js/classes/handbrake-js.html#method_run). For the full list of HandbrakeCLI options, see [here](https://trac.handbrake.fr/wiki/CLIGuide).

Contributing
============
Fork the project then run:
```sh
$ git clone <your fork>
$ cd handbrake-js
$ npm link
$ <write some code>
$ npm test
```
