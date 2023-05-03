[![view on npm](https://badgen.net/npm/v/handbrake-js)](https://www.npmjs.org/package/handbrake-js)
[![npm module downloads](https://badgen.net/npm/dt/handbrake-js)](https://www.npmjs.org/package/handbrake-js)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/75lb/handbrake-js)](https://github.com/75lb/handbrake-js/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/75lb/handbrake-js)](https://github.com/75lb/handbrake-js/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/75lb/handbrake-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/75lb/handbrake-js/actions/workflows/node.js.yml)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

***Upgraders, please read the [release notes](https://github.com/75lb/handbrake-js/releases).***

# handbrake-js

Handbrake-js is [Handbrake](http://handbrake.fr) ([v1.6.1](https://github.com/HandBrake/HandBrake/releases/tag/1.6.1)) for [node.js](http://nodejs.org). It aspires to provide a lean and stable foundation for building video transcoding software in node.js.

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
Just [node.js](http://nodejs.org). On Mac and Windows, every else is installed automatically. However on Linux, you must install HandbrakeCLI manually with these commands:

```
sudo add-apt-repository --yes ppa:stebbins/handbrake-releases
sudo apt-get update -qq
sudo apt-get install -qq handbrake-cli
```

### As a library
Move into your project directory then run:
```sh
$ npm install handbrake-js --save
```
*Mac / Linux users may need to run with `sudo`*.

Now you can begin encoding from your app.

```js
const hbjs = require('handbrake-js')

hbjs.spawn({ input: 'something.avi', output: 'something.m4v' })
  .on('error', err => {
    // invalid user input, no video found etc
  })
  .on('progress', progress => {
    console.log(
      'Percent complete: %s, ETA: %s',
      progress.percentComplete,
      progress.eta
    )
  })
```
### As a command-line app
From any directory run the following:
```sh
$ npm install -g handbrake-js
```
*Mac / Linux users may need to run with `sudo`*.

Now, you can call `handbrake` as you would HandbrakeCLI, using all the usual [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html). By default, just statistics are output, passing `--verbose` prints the raw HandbrakeCLI output. This command will transcode an AVI to the more universal H.264 (mp4):
```
$ handbrake --input 'some episode.avi' --output 'some episode.mp4' --preset Normal
Task      % done     FPS       Avg FPS   ETA
Encoding  1.07       131.76    158.12    00h21m11s
```

# API Reference
Handbrake for node.js.

**Example**  
```js
const hbjs = require('handbrake-js')
```

* [handbrake-js](#module_handbrake-js)
    * _static_
        * [.spawn([options])](#module_handbrake-js.spawn) ⇒ [<code>Handbrake</code>](#module_handbrake-js..Handbrake)
        * [.exec(options, [onComplete])](#module_handbrake-js.exec)
        * [.run(options)](#module_handbrake-js.run) ⇒ <code>Promise</code>
    * _inner_
        * [~Handbrake](#module_handbrake-js..Handbrake) ⇐ [<code>EventEmitter</code>](http://nodejs.org/api/events.html)
            * [.output](#module_handbrake-js..Handbrake+output) : <code>string</code>
            * [.options](#module_handbrake-js..Handbrake+options) : <code>object</code>
            * [.eError](#module_handbrake-js..Handbrake+eError)
            * [.cancel()](#module_handbrake-js..Handbrake+cancel)
            * ["start"](#module_handbrake-js..Handbrake+event_start)
            * ["begin"](#module_handbrake-js..Handbrake+event_begin)
            * ["progress" (progress)](#module_handbrake-js..Handbrake+event_progress)
            * ["output" (output)](#module_handbrake-js..Handbrake+event_output)
            * ["error" (error)](#module_handbrake-js..Handbrake+event_error)
            * ["end"](#module_handbrake-js..Handbrake+event_end)
            * ["complete"](#module_handbrake-js..Handbrake+event_complete)
            * ["cancelled"](#module_handbrake-js..Handbrake+event_cancelled)

<a name="module_handbrake-js.spawn"></a>

### hbjs.spawn([options]) ⇒ [<code>Handbrake</code>](#module_handbrake-js..Handbrake)
Spawns a HandbrakeCLI process with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options), returning an instance of `Handbrake` on which you can listen for events.

**Kind**: static method of [<code>handbrake-js</code>](#module_handbrake-js)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI |
| [options.HandbrakeCLIPath] | <code>string</code> | Override the built-in `HandbrakeCLI` binary path. |

**Example**  
```js
const hbjs = require('handbrake-js')

const options = {
  input: 'something.avi',
  output: 'something.mp4',
  preset: 'Normal',
  rotate: 1
}
hbjs.spawn(options)
  .on('error', console.error)
  .on('output', console.log)
```
<a name="module_handbrake-js.exec"></a>

### hbjs.exec(options, [onComplete])
Runs HandbrakeCLI with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

**Kind**: static method of [<code>handbrake-js</code>](#module_handbrake-js)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI |
| [options.HandbrakeCLIPath] | <code>string</code> | Override the built-in `HandbrakeCLI` binary path. |
| [onComplete] | <code>function</code> | If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output. |

**Example**  
```js
const hbjs = require('handbrake-js')

hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
  if (err) throw err
  console.log(stdout)
})
```
<a name="module_handbrake-js.run"></a>

### hbjs.run(options) ⇒ <code>Promise</code>
Identical to `hbjs.exec` except it returns a promise, rather than invoke a callback. Use this when you don't need the progress events reported by `hbjs.spawn`. Fulfils with an object containing the output in two properties: `stdout` and `stderr`.

**Kind**: static method of [<code>handbrake-js</code>](#module_handbrake-js)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI |
| [options.HandbrakeCLIPath] | <code>string</code> | Override the built-in `HandbrakeCLI` binary path. |

**Example**  
```js
const hbjs = require('handbrake-js')

async function start () {
  const result = await hbjs.run({ version: true })
  console.log(result.stdout)
  // prints 'HandBrake 1.3.0'
}

start().catch(console.error)
```
<a name="module_handbrake-js..Handbrake"></a>

### handbrake-js~Handbrake ⇐ [<code>EventEmitter</code>](http://nodejs.org/api/events.html)
A handle on the HandbrakeCLI process. Emits events you can monitor to track progress. An instance of this class is returned by [spawn](#module_handbrake-js.spawn).

**Kind**: inner class of [<code>handbrake-js</code>](#module_handbrake-js)  
**Extends**: [<code>EventEmitter</code>](http://nodejs.org/api/events.html)  
**Emits**: [<code>start</code>](#module_handbrake-js..Handbrake+event_start), [<code>begin</code>](#module_handbrake-js..Handbrake+event_begin), [<code>progress</code>](#module_handbrake-js..Handbrake+event_progress), [<code>output</code>](#module_handbrake-js..Handbrake+event_output), [<code>error</code>](#module_handbrake-js..Handbrake+event_error), [<code>end</code>](#module_handbrake-js..Handbrake+event_end), [<code>complete</code>](#module_handbrake-js..Handbrake+event_complete), [<code>cancelled</code>](#module_handbrake-js..Handbrake+event_cancelled)  

* [~Handbrake](#module_handbrake-js..Handbrake) ⇐ [<code>EventEmitter</code>](http://nodejs.org/api/events.html)
    * [.output](#module_handbrake-js..Handbrake+output) : <code>string</code>
    * [.options](#module_handbrake-js..Handbrake+options) : <code>object</code>
    * [.eError](#module_handbrake-js..Handbrake+eError)
    * [.cancel()](#module_handbrake-js..Handbrake+cancel)
    * ["start"](#module_handbrake-js..Handbrake+event_start)
    * ["begin"](#module_handbrake-js..Handbrake+event_begin)
    * ["progress" (progress)](#module_handbrake-js..Handbrake+event_progress)
    * ["output" (output)](#module_handbrake-js..Handbrake+event_output)
    * ["error" (error)](#module_handbrake-js..Handbrake+event_error)
    * ["end"](#module_handbrake-js..Handbrake+event_end)
    * ["complete"](#module_handbrake-js..Handbrake+event_complete)
    * ["cancelled"](#module_handbrake-js..Handbrake+event_cancelled)

<a name="module_handbrake-js..Handbrake+output"></a>

#### handbrake.output : <code>string</code>
A `string` containing all handbrakeCLI output

**Kind**: instance property of [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
<a name="module_handbrake-js..Handbrake+options"></a>

#### handbrake.options : <code>object</code>
a copy of the options passed to [spawn](#module_handbrake-js.spawn)

**Kind**: instance property of [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
<a name="module_handbrake-js..Handbrake+eError"></a>

#### handbrake.eError
All operational errors are emitted via the [error](#module_handbrake-js..Handbrake+event_error) event.

**Kind**: instance enum of [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
**Properties**

| Name | Default | Description |
| --- | --- | --- |
| VALIDATION | <code>ValidationError</code> | Thrown if you accidentally set identical input and output paths (which would clobber the input file), forget to specifiy an output path and other validation errors. |
| INVALID_INPUT | <code>InvalidInput</code> | Thrown when the input file specified does not appear to be a video file. |
| INVALID_PRESET | <code>InvalidPreset</code> | Thrown when an invalid preset is specified. |
| OTHER | <code>Other</code> | Thrown if Handbrake crashes. |
| NOT_FOUND | <code>HandbrakeCLINotFound</code> | Thrown if the installed HandbrakeCLI binary has gone missing. |

<a name="module_handbrake-js..Handbrake+cancel"></a>

#### handbrake.cancel()
Cancel the encode, kill the underlying HandbrakeCLI process then emit a `cancelled` event.

**Kind**: instance method of [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
<a name="module_handbrake-js..Handbrake+event_start"></a>

#### "start"
Fired as HandbrakeCLI is launched. Nothing has happened yet.

**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
<a name="module_handbrake-js..Handbrake+event_begin"></a>

#### "begin"
Fired when encoding begins. If you're expecting an encode and this never fired, something went wrong.

**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
<a name="module_handbrake-js..Handbrake+event_progress"></a>

#### "progress" (progress)
Fired at regular intervals passing a `progress` object.

**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  

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

<a name="module_handbrake-js..Handbrake+event_output"></a>

#### "output" (output)
**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  

| Param | Type | Description |
| --- | --- | --- |
| output | <code>string</code> | An aggregate of `stdout` and `stderr` output from the underlying HandbrakeCLI process. |

<a name="module_handbrake-js..Handbrake+event_error"></a>

#### "error" (error)
**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | All operational exceptions are delivered via this event. |
| error.name | [<code>eError</code>](#module_handbrake-js..Handbrake+eError) | The unique error identifier |
| error.message | <code>string</code> | Error description |
| error.errno | <code>string</code> | The HandbrakeCLI return code |

<a name="module_handbrake-js..Handbrake+event_end"></a>

#### "end"
Fired on successful completion of an encoding task. Always follows a [begin](#module_handbrake-js..Handbrake+event_begin) event, with some [progress](#module_handbrake-js..Handbrake+event_progress) in between.

**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
<a name="module_handbrake-js..Handbrake+event_complete"></a>

#### "complete"
Fired when HandbrakeCLI exited cleanly. This does not necessarily mean your encode completed as planned..

**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  
<a name="module_handbrake-js..Handbrake+event_cancelled"></a>

#### "cancelled"
If `.cancel()` was called, this event is emitted once the underlying HandbrakeCLI process has closed.

**Kind**: event emitted by [<code>Handbrake</code>](#module_handbrake-js..Handbrake)  

* * *

&copy; 2013-23 Lloyd Brookes &lt;75pound@gmail.com&gt;.

Tested by [test-runner](https://github.com/test-runner-js/test-runner). Documented by [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).

Handbrake ([Authors](https://github.com/HandBrake/HandBrake/blob/master/AUTHORS.markdown)) is licensed by [GNU General Public License Version 2](https://github.com/HandBrake/HandBrake/blob/master/LICENSE).
