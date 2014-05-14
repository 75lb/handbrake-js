[![view on npm](http://img.shields.io/npm/v/handbrake-js.svg)](https://www.npmjs.org/package/handbrake-js)
[![npm module downloads per month](http://img.shields.io/npm/dm/handbrake-js.svg)](https://www.npmjs.org/package/handbrake-js)
[![Build Status](https://travis-ci.org/75lb/handbrake-js.svg?branch=master)](https://travis-ci.org/75lb/handbrake-js)
[![Dependency Status](https://david-dm.org/75lb/handbrake-js.svg)](https://david-dm.org/75lb/handbrake-js)
![Analytics](https://ga-beacon.appspot.com/UA-27725889-6/handbrake-js/README.md?pixel)

#handbrake-js
Handbrake-js is [Handbrake](http://handbrake.fr) for [node.js](http://nodejs.org). Funnily enough. It aspires to provide a lean and stable foundation for building video transcoding software.

Tested on Mac OSX, Ubuntu 14, Windows XP, Windows 8.1.

##Installation
###System Requirements
Just [node.js](http://nodejs.org). Every else is installed automatically.

###As a library 
Move into your project directory then run: 
```sh
$ npm install handbrake-js --save
```
*Mac / Linux users may need to run with `sudo`*.

Now you can begin encoding from your app. 

```js
var hbjs = require("handbrake-js");

hbjs.spawn({ input: "dope shit.avi", output: "dope shit.m4v" })
  .on("error", function(err){
    // invalid user input, no video found etc
  })
  .on("progress", function(progress){
    console.log(
      "Percent complete: %s, ETA: %s", 
      progress.percentComplete, 
      progress.eta
    );
  });
```
###As a command-line app
From any directory run the following:
```sh
$ npm install -g handbrake-js
```
*Mac / Linux users may need to run with `sudo`*.

Now, you can call `handbrake` as you would HandbrakeCLI, using all the usual [options](https://trac.handbrake.fr/wiki/CLIGuide). This command will transcode an AVI to the more universal H.264 (mp4):
```sh
$ handbrake --input "some episode.avi" --output "some episode.mp4" --preset Normal
```

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
#API Documentation
Handbrake for node.js.


###hbjs.spawn(options, [mocks])
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning an instance of `Handbrake` on which you can listen for events.


- options `Object | Array` [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI  
- mocks `Object` Optional mock objects, for testing  


**Returns**: A `Handbrake` instance on which you can listen for events.


####Examples
```js
var handbrakeJs = require("handbrake-js");

handbrakeJs.spawn(options)
    .on("error", console.error)
    .on("output", console.log);
```


##class: Handbrake
A thin wrapper on the handbrakeCLI child_process handle

**Extends**: `EventEmitter`



###handbrake.allOutput
A `String` containing all handbrakeCLI output
###handbrake.inProgress
`true` while encoding
###handbrake.options
the options HandbrakeCLI was spawned with




###event: "progress"
Fired at regular intervals passing a `progress` object containing:

- taskNumber `Number` current task index
- taskCount `Number` total tasks in the queue
- percentComplete `Number`
- fps `Number` Frames per second
- avgFps `Number` Average frames per second
- eta `String` Estimated time until completion
- task `String` Task description, either "Encoding" or "Muxing"

###event: "output"
An aggregate of `stdout` and `stderr` output from the underlying HandbrakeCLI process.

###event: "error"
All operational exceptions are delivered via this event. Emits one of five types of `Error` instance: 

- HandbrakeCLINotFound
- HandbrakeCLIError
- NoTitleFound
- HandbrakeCLICrash
- InvalidOption

###event: "complete"
Fired on successful completion

###event: "start"
Fired when encoding begins



