[![view on npm](http://img.shields.io/npm/v/handbrake-js.svg)](https://www.npmjs.org/package/handbrake-js)
[![npm module downloads per month](http://img.shields.io/npm/dm/handbrake-js.svg)](https://www.npmjs.org/package/handbrake-js)
[![Build Status](https://travis-ci.org/75lb/handbrake-js.svg?branch=master)](https://travis-ci.org/75lb/handbrake-js)
[![Dependency Status](https://david-dm.org/75lb/handbrake-js.svg)](https://david-dm.org/75lb/handbrake-js)
![Analytics](https://ga-beacon.appspot.com/UA-27725889-6/handbrake-js/README.md?pixel)

# handbrake-js
Handbrake-js is [Handbrake](http://handbrake.fr) (v0.10.1) for [node.js](http://nodejs.org), funnily enough. It aspires to provide a lean and stable foundation for building video transcoding software in node.js.

HandBrake is a tool for converting video from nearly any format to a selection of modern, widely supported codecs. It can process most common multimedia files and any DVD or BluRay sources that do not contain any copy protection.

Outputs:

* File Containers: .MP4(.M4V) and .MKV
* Video Encoders: H.264(x264), H.265(x265) MPEG-4 and MPEG-2 (libav), VP8 (libvpx) and Theora(libtheora)
* Audio Encoders: AAC, CoreAudio AAC/HE-AAC (OS X Only), MP3, Flac, AC3, or Vorbis
* Audio Pass-thru: AC-3, DTS, DTS-HD, AAC and MP3 tracks

[Read more about the features](https://handbrake.fr/features.php). 

### Compatible Platforms
Tested on Mac OSX, Ubuntu 14, Windows XP, Windows 7 and Windows 8.1.

**Ubuntu 14.04 notice**: Transcoding to MP4 fails on Ubuntu since 14.04 [for this reason](https://forum.handbrake.fr/viewtopic.php?f=13&t=30044).

## Installation
### System Requirements
Just [node.js](http://nodejs.org). Every else is installed automatically.

### As a library 
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
### As a command-line app
From any directory run the following:
```sh
$ npm install -g handbrake-js
```
*Mac / Linux users may need to run with `sudo`*.

Now, you can call `handbrake` as you would HandbrakeCLI, using all the usual [options](https://trac.handbrake.fr/wiki/CLIGuide). By default, just statistics are output, passing `--verbose` prints the raw HandbrakeCLI output. This command will transcode an AVI to the more universal H.264 (mp4):
```
$ handbrake --input "some episode.avi" --output "some episode.mp4" --preset Normal
Task      % done     FPS       Avg FPS   ETA
Encoding  1.07       131.76    158.12    00h21m11s
```

# API Reference
Handbrake for node.js.

**Example**  
```js
var hbjs = require("handbrake-js");
```

* [handbrake-js](#module_handbrake-js)
  * _static_
    * [.spawn(options)](#module_handbrake-js.spawn) ⇒ <code>[Handbrake](#module_handbrake-js..Handbrake)</code>
    * [.exec(options, [onComplete])](#module_handbrake-js.exec)
  * _inner_
    * [~Handbrake](#module_handbrake-js..Handbrake) ⇐ <code>[EventEmitter](http://nodejs.org/api/events.html)</code>
      * [.output](#module_handbrake-js..Handbrake#output) : <code>string</code>
      * [.options](#module_handbrake-js..Handbrake#options) : <code>object</code>
      * [.eError](#module_handbrake-js..Handbrake#eError)
      * ["start"](#module_handbrake-js..Handbrake#event_start)
      * ["begin"](#module_handbrake-js..Handbrake#event_begin)
      * ["progress" (progress)](#module_handbrake-js..Handbrake#event_progress)
      * ["output" (output)](#module_handbrake-js..Handbrake#event_output)
      * ["error" (error)](#module_handbrake-js..Handbrake#event_error)
      * ["end"](#module_handbrake-js..Handbrake#event_end)
      * ["complete"](#module_handbrake-js..Handbrake#event_complete)

<a name="module_handbrake-js.spawn"></a>
### hbjs.spawn(options) ⇒ <code>[Handbrake](#module_handbrake-js..Handbrake)</code>
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide#options), returning an instance of `Handbrake` on which you can listen for events.

**Kind**: static method of <code>[handbrake-js](#module_handbrake-js)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | [Options](https://trac.handbrake.fr/wiki/CLIGuide#options) to pass directly to HandbrakeCLI |

**Example**  
```js
var hbjs = require("handbrake-js");

hbjs.spawn(options)
    .on("error", console.error)
    .on("output", console.log);
```
<a name="module_handbrake-js.exec"></a>
### hbjs.exec(options, [onComplete])
Runs HandbrakeCLI with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide#options) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

**Kind**: static method of <code>[handbrake-js](#module_handbrake-js)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | [Options](https://trac.handbrake.fr/wiki/CLIGuide#options) to pass directly to HandbrakeCLI |
| [onComplete] | <code>function</code> | If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output. |

**Example**  
```js
var hbjs = require("handbrake-js");

hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
    if (err) throw err;
    console.log(stdout);
});
```
<a name="module_handbrake-js..Handbrake"></a>
### hbjs~Handbrake ⇐ <code>[EventEmitter](http://nodejs.org/api/events.html)</code>
A handle on the HandbrakeCLI process. Emits events you can monitor to track progress. An instance of this class is returned by [spawn](#module_handbrake-js.spawn).

**Extends:** <code>[EventEmitter](http://nodejs.org/api/events.html)</code>  
**Kind**: inner class of <code>[handbrake-js](#module_handbrake-js)</code>  
**Emits**: <code>[start](#module_handbrake-js..Handbrake#event_start)</code>, <code>[begin](#module_handbrake-js..Handbrake#event_begin)</code>, <code>[progress](#module_handbrake-js..Handbrake#event_progress)</code>, <code>[output](#module_handbrake-js..Handbrake#event_output)</code>, <code>[error](#module_handbrake-js..Handbrake#event_error)</code>, <code>[end](#module_handbrake-js..Handbrake#event_end)</code>, <code>[complete](#module_handbrake-js..Handbrake#event_complete)</code>  

  * [~Handbrake](#module_handbrake-js..Handbrake) ⇐ <code>[EventEmitter](http://nodejs.org/api/events.html)</code>
    * [.output](#module_handbrake-js..Handbrake#output) : <code>string</code>
    * [.options](#module_handbrake-js..Handbrake#options) : <code>object</code>
    * [.eError](#module_handbrake-js..Handbrake#eError)
    * ["start"](#module_handbrake-js..Handbrake#event_start)
    * ["begin"](#module_handbrake-js..Handbrake#event_begin)
    * ["progress" (progress)](#module_handbrake-js..Handbrake#event_progress)
    * ["output" (output)](#module_handbrake-js..Handbrake#event_output)
    * ["error" (error)](#module_handbrake-js..Handbrake#event_error)
    * ["end"](#module_handbrake-js..Handbrake#event_end)
    * ["complete"](#module_handbrake-js..Handbrake#event_complete)

<a name="module_handbrake-js..Handbrake#output"></a>
#### handbrake.output : <code>string</code>
A `string` containing all handbrakeCLI output

**Kind**: instance property of <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  
<a name="module_handbrake-js..Handbrake#options"></a>
#### handbrake.options : <code>object</code>
a copy of the options passed to [spawn](#module_handbrake-js.spawn)

**Kind**: instance property of <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  
<a name="module_handbrake-js..Handbrake#eError"></a>
#### handbrake.eError
All operational errors are emitted via the [error](#module_handbrake-js..Handbrake#event_error) event.

**Kind**: instance enum property of <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  
**Properties**

| Name | Default | Description |
| --- | --- | --- |
| VALIDATION | <code>ValidationError</code> | Thrown if you accidentally set identical input and output paths (which would clobber the input file), forget to specifiy an output path and other validation errors |
| INVALID_INPUT | <code>InvalidInput</code> | Thrown when the input file specified does not appear to be a video file |
| OTHER | <code>Other</code> | Thrown if Handbrake crashes |
| NOT_FOUND | <code>HandbrakeCLINotFound</code> | Thrown if the installed HandbrakeCLI binary has gone missing.. |

<a name="module_handbrake-js..Handbrake#event_start"></a>
#### "start"
Fired as HandbrakeCLI is launched. Nothing has happened yet.

**Kind**: event emitted by <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  
<a name="module_handbrake-js..Handbrake#event_begin"></a>
#### "begin"
Fired when encoding begins. If you're expecting an encode and this never fired, something went wrong.

**Kind**: event emitted by <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  
<a name="module_handbrake-js..Handbrake#event_progress"></a>
#### "progress" (progress)
Fired at regular intervals passing a `progress` object.

**Kind**: event emitted by <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  

| Param | Type | Description |
| --- | --- | --- |
| progress | <code>object</code> | details of encode progress |
| progress.taskNumber | <code>number</code> | current task index |
| progress.taskCount | <code>number</code> | total tasks in the queue |
| progress.percentComplete | <code>number</code> | percent complete |
| progress.fps | <code>number</code> | Frames per second |
| progress.avgFps | <code>number</code> | Average frames per second |
| progress.eta | <code>string</code> | Estimated time until completion |
| progress.task | <code>string</code> | Task description, either "Encoding" or "Muxing" |

<a name="module_handbrake-js..Handbrake#event_output"></a>
#### "output" (output)
**Kind**: event emitted by <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  

| Param | Type | Description |
| --- | --- | --- |
| output | <code>string</code> | An aggregate of `stdout` and `stderr` output from the underlying HandbrakeCLI process. |

<a name="module_handbrake-js..Handbrake#event_error"></a>
#### "error" (error)
**Kind**: event emitted by <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | All operational exceptions are delivered via this event. |
| error.name | <code>[eError](#module_handbrake-js..Handbrake#eError)</code> | The unique error identifier |
| error.message | <code>string</code> | Error description |
| error.errno | <code>string</code> | The HandbrakeCLI return code |

<a name="module_handbrake-js..Handbrake#event_end"></a>
#### "end"
Fired on successful completion of an encoding task. Always follows a [begin](#module_handbrake-js..Handbrake#event_begin) event, with some [progress](#module_handbrake-js..Handbrake#event_progress) in between.

**Kind**: event emitted by <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  
<a name="module_handbrake-js..Handbrake#event_complete"></a>
#### "complete"
Fired when HandbrakeCLI exited cleanly. This does not necessarily mean your encode completed as planned..

**Kind**: event emitted by <code>[Handbrake](#module_handbrake-js..Handbrake)</code>  

* * * 

&copy; 2015 Lloyd Brookes 75pound@gmail.com. Documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown).
