[![view on npm](http://img.shields.io/npm/v/handbrake-js.svg)](https://www.npmjs.org/package/handbrake-js)
![npm module downloads per month](http://img.shields.io/npm/dm/handbrake-js.svg)
[![Build Status](https://travis-ci.org/75lb/handbrake-js.svg?branch=master)](https://travis-ci.org/75lb/handbrake-js)
[![Dependency Status](https://david-dm.org/75lb/handbrake-js.svg)](https://david-dm.org/75lb/handbrake-js)
![Analytics](https://ga-beacon.appspot.com/UA-27725889-6/handbrake-js/README.md?pixel)

handbrake-js
============
Handbrake-js is a [node.js](http://nodejs.org) module wrapping [Handbrake](http://handbrake.fr) (v0.9.9) with a Javascript API, documented below. It's primary purpose is to bring video transcoding to your app.

Installation
============
All 3rd party dependencies, including HandbrakeCLI itself, are installed automatically. The only system requirement is [node.js](http://nodejs.org), which you should install first.

*Mac / Linux users may need to run either of the following commands with `sudo`*.

As a library 
------------
Move into your project directory then run: 
```sh
$ npm install handbrake-js --save
```

As a command-line app
---------------------
From any directory run the following:
```sh
$ npm install -g handbrake-js
```

Now, you can call `handbrake` as you would HandbrakeCLI, using all the usual [options](https://trac.handbrake.fr/wiki/CLIGuide). This command will transcode an AVI to the more universal H.264 (mp4):
```sh
$ handbrake --input "some episode.avi" --output "some episode.mp4" --preset Normal
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
