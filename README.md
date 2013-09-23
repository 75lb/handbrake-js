[![Build Status](https://travis-ci.org/75lb/handbrake-js.png?branch=master)](https://travis-ci.org/75lb/handbrake-js)
[![NPM version](https://badge.fury.io/js/handbrake-js.png)](http://badge.fury.io/js/handbrake-js)

handbrake-js
============
A cross-platform npm distribution for [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide) (v0.9.9) designed for command line or library use.

As a command line tool
======================
Install
-------
```sh
$ npm install -g handbrake-js
```
*Mac / Linux users may need to run the above with `sudo`*

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
$ npm install handbrake-js --save
```

HandbrakeCLI installation
=========================
On **Windows** and **Mac OSX** installing handbrake-js automatically installs the correct HandbrakeCLI binary for your platform. **Ubuntu** users should additionally run:
```sh
$ sudo npm -g run-script handbrake-js ubuntu-setup
```

API Documentation
=================

##Methods

###exec

Runs HandbrakeCLI with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

####Parameters
*   options _Object | Thing | Array_

    [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
    
*   onComplete _Function_

    If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output.
    
####Example

```js
var handbrake = require("handbrake-js");

handbrake.exec({ preset-list: true }, function(err, stdout, stderr){
    if (err) throw err;
    console.log(stdout);
});
```

###spawn

Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning a handle on the running process.

####Parameters
*   options _Object | Thing | Array_

    [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
    

**Returns**: HandbrakeProcess  
A handle on which you can listen for events on the Handbrake process.

####Example

```js
var handbrake = require("handbrake-js");

var options = {
    input: "Eight Miles High.mov",
    output: "Eight Miles High.m4v",
    preset: "Normal"
};

handbrake.spawn(options)
    .on("error", function(err){
        console.log("ERROR: " + err.message);
    })
    .on("output", console.log);
    .on("progress", function(progress){
        console.log(progress.task + ": " + progress.percentComplete);
    })
    .on("complete", function(){ 
        console.log("Done!"); 
    });
```
[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/75lb/handbrake-js/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/22acb2c5591fafaadb7be7a16870c144 "githalytics.com")](http://githalytics.com/75lb/handbrake-js)
