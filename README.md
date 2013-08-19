[![Build Status](https://travis-ci.org/75lb/handbrake-js.png?branch=master)](https://travis-ci.org/75lb/handbrake-js)
[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/22acb2c5591fafaadb7be7a16870c144 "githalytics.com")](http://githalytics.com/75lb/handbrake-js)

handbrake-js
============
A cross-platform npm distribution for [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide) (v0.9.9) designed for command line or library use.

HandbrakeCLI installation
=========================
On **Windows** and **Mac OSX** installing handbrake-js automatically installs the correct HandbrakeCLI binary for your platform. **Ubuntu** users should additionally run:
```sh
$ sudo npm -g run-script handbrake-js ubuntu-setup
```

As a command line tool
======================
Install
-------
```sh
$ npm install -g handbrake-js
```
** Mac / Linux users may need to run the above with `sudo` **

Usage
-----
Call `handbrake-js` as you would HandbrakeCLI, using all the usual [options](https://trac.handbrake.fr/wiki/CLIGuide):
```sh
$ handbrake-js --input "Ballroom Bangra.avi" --output "Ballroom Bangra.mp4" --preset Normal
```

As a library
============
Install
-------
```sh
$ npm install handbrake-js
```

API Documentation
=================

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
