[![NPM version](https://badge.fury.io/js/handbrake-js.png)](http://badge.fury.io/js/handbrake-js)
[![Build Status](https://travis-ci.org/75lb/handbrake-js.png?branch=master)](https://travis-ci.org/75lb/handbrake-js)
[![Dependency Status](https://david-dm.org/75lb/handbrake-js.png)](https://david-dm.org/75lb/handbrake-js)
![Analytics](https://ga-beacon.appspot.com/UA-27725889-6/handbrake-js/README.md?pixel)

handbrake-js
============
A cross-platform npm distribution for [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide) (v0.9.9) designed for command line or library use.

Command line use
================
Install
-------
```sh
$ npm install -g handbrake-js
```
*Mac / Linux users may need to run the above with `sudo`*

Usage
-----
Call `handbrake` as you would HandbrakeCLI, using all the usual [options](https://trac.handbrake.fr/wiki/CLIGuide):
```sh
$ handbrake --input "Ballroom Bangra.avi" --output "Ballroom Bangra.mp4" --preset Normal
```

Notifications
-------------
During long-running encodes, Mac users can receive system notifications every three minutes displaying current progress. To enable this, ensure [terminal-notifier](https://github.com/alloy/terminal-notifier) is installed. 

**Install via [homebrew](http://brew.sh):**

```sh
$ brew install terminal-notifier
```

**Install via [RubyGems](http://rubygems.org):**
```sh
$ [sudo] gem install terminal-notifier
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

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

API Documentation
=================
#handbrake-js

An npm distribution of [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide) for command line or library use.

##Methods

###exec

Runs HandbrakeCLI with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

**Params**:  
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

**Returns**: _HandbrakeProcess_ - A handle on which you can listen for events on the Handbrake process.

**Params**:  
*   options _Object | Thing | Array_

    [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI

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

#HandbrakeProcess

A handle on the Handbrake encoding process, used to catch and respond to run-time events.

##Events

###progress

Fired at regular intervals passing progress information

**Params**:  
*   progress _Object_
    * percentComplete _Number_ - Percentage complete
    * fps _Number_ - Frames per second
    * avgFps _Number_ - Average frames per second
    * eta _String_ - Estimated time until completion
    * task _String_ - Task description, e.g. "Encoding", "Scanning" etc.


###output

Passes the standard HandbrakeCLI output

**Params**:  
*   output _String_


###terminated

Fired if Handbrake-js was killed by CTRL-C

###error

Fired if either HandbrakeCLI crashed or ran successfully but failed to find a valid title in the input video.

**Params**:  
*   error _Error_


###complete

Fired on completion of a successful encode

#HandbrakeOptions

An options [Thing](https://github.com/75lb/nature) describing all valid Handbrake option names, types and values.

[![NPM](https://nodei.co/npm-dl/handbrake-js.png?months=3)](https://nodei.co/npm/handbrake-js/)
