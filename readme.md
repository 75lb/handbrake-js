[![view on npm](https://badgen.net/npm/v/handbrake-js)](https://www.npmjs.org/package/handbrake-js)
[![npm module downloads](https://badgen.net/npm/dt/handbrake-js)](https://www.npmjs.org/package/handbrake-js)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/75lb/handbrake-js)](https://github.com/75lb/handbrake-js/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/75lb/handbrake-js)](https://github.com/75lb/handbrake-js/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/75lb/handbrake-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/75lb/handbrake-js/actions/workflows/node.js.yml)

***Upgraders, please read the [release notes](https://github.com/75lb/handbrake-js/releases).***

# handbrake-js

Handbrake-js is [Handbrake](http://handbrake.fr) ([v1.11.1](https://github.com/HandBrake/HandBrake/releases/tag/1.11.1) for [node.js](http://nodejs.org). It aspires to provide a lean and stable foundation for building video transcoding software in node.js.

HandBrake is a tool for converting video from nearly any format to a selection of modern, widely supported codecs. It can process most common multimedia files and any DVD or BluRay sources that do not contain any copy protection.

Outputs:

* File Containers: .MP4(.M4V) and .MKV
* Video Encoders: H.264(x264), H.265(x265) MPEG-4 and MPEG-2 (libav), VP8 (libvpx) and Theora(libtheora)
* Audio Encoders: AAC, CoreAudio AAC/HE-AAC (OS X Only), MP3, Flac, AC3, or Vorbis
* Audio Pass-thru: AC-3, DTS, DTS-HD, AAC and MP3 tracks

[Read more about the features](https://handbrake.fr/features.php).

### Compatible Platforms

Tested on Mac, Ubuntu and Windows.

## Installation

### System Requirements

Just [node.js](http://nodejs.org). On Mac and Windows, everything else is installed automatically. However on Ubuntu, you must install HandbrakeCLI manually with this command:

```
$ sudo apt install handbrake-cli
```

Users of other Linux distros can install the GUI and CLI together using flatpak. Instructions [here](https://handbrake.fr/docs/en/latest/get-handbrake/download-and-install.html).

Once the HandBrakeCLI binary is installed, you might need to specify its path to handbrake-js, see [here](https://github.com/75lb/handbrake-js/tree/master#handbrakecli-path).

### As a library

Move into your project directory then run:

```sh
$ npm install handbrake-js --save
```

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

Now, you can call `handbrake` as you would HandbrakeCLI, using all the usual [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html). By default, just statistics are output, passing `--verbose` prints the raw HandbrakeCLI output. The following example command transcodes an AVI to the more universally-compatible H.264 (mp4):

```
$ handbrake --input 'some episode.avi' --output 'some episode.mp4' --preset Normal
Task      % done     FPS       Avg FPS   ETA
Encoding  1.07       131.76    158.12    00h21m11s
```

## HandbrakeCLI Path

In some situations or environments (e.g. Docker) you may need to specify a custom HandbrakeCLI path. You can either specify the path in an environment variable:

```sh
HANDBRAKECLI_PATH="./example/HandbrakeCLI"
```

..or pass `HandbrakeCLIPath` as an option, programmatically. See the API documentation below for instructions. Also, see the [examples folder](https://github.com/75lb/handbrake-js/tree/master/examples) for example code.

<hr>

# API Reference

## handbrake-js

Handbrake for node.js.

- **Type:** Package
- **Module type:** Package exports both JavaScript and CommonJS Modules
- **Exported features:** Multiple individual functions.
- **Supported runtimes:** Node.Js version >= 14

#### Example

```js
import hbjs from 'handbrake-js'
const result = await hbjs.run({ input: 'input.mov', output: 'output.mp4' })
```

#### API Surface

* _exported features_
  * spawn ([options]) : `Handbrake`
  * exec (options, [onComplete]) : `void`
  * run (options) : `Promise<{ stdout: string, stderr: string }>`
* _exposed inner features_
  * ~Handbrake
    * .output : `string`
    * .options : `object`
    * .eError : `enum`
    * .cancel() : `void`
    * "start"
    * "begin"
    * "progress" (`progress`)
    * "output" (`output`)
    * "error" (`error`)
    * "end"
    * "complete"
    * "cancelled"

### hbjs.spawn (options = {}, [mocks]) : `Handbrake`

Spawns a HandbrakeCLI process with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options), returning an instance of `Handbrake` on which you can listen for progress events.

- **Type:** Exported, synchronous function
- **Returns:** `Handbrake`

| Param | Type | Description |
| --- | --- | --- |
| [options] | `object` | [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI |
| [options.HandbrakeCLIPath] | `string` | Override the built-in `HandbrakeCLI` binary path. |


#### Example

```js
import hbjs from 'handbrake-js'
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

### hbjs.exec (options = {}, onComplete) : void

Runs HandbrakeCLI with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

- **Type:** Exported, synchronous function

| Param | Type | Description |
| --- | --- | --- |
| options | `object` | [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI |
| [options.HandbrakeCLIPath] | `string` | Override the built-in `HandbrakeCLI` binary path. |
| [onComplete] | `Function` | If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output. |


#### Example

```js
import hbjs from 'handbrake-js'
hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
  if (err) throw err
  console.log(stdout)
})
```

### hbjs.run (options) : Promise<{ stdout: string, stderr: string }>

Identical to `hbjs.exec` except it returns a promise, rather than invoke a callback. Use this when you don't need the progress events reported by `hbjs.spawn`. Fulfils with an object containing the output in two properties: `stdout` and `stderr`.

- **Type:** Exported, asynchronous function
- **Returns:** `Promise`
- **Fulfils:** `{ stdout, stderr }`

| Param | Type | Description |
| --- | --- | --- |
| options | `objec` | [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI |
| [options.HandbrakeCLIPath] | `string` | Override the built-in `HandbrakeCLI` binary path. |


#### Example

```js
import hbjs from 'handbrake-js'
async function start () {
  const result = await hbjs.run({ version: true })
  console.log(result.stdout)
  // prints 'HandBrake 1.3.0'
}
start().catch(console.error)
```

## hbjs~Handbrake

A handle on the HandbrakeCLI process. Emits events you can monitor to track progress. An instance of this class is returned by `hbjs.spawn()`.

- **Type:** Internal Class
- **Extends:** EventEmitter
- **Emits:** start, begin, progress, output, error, end, complete, cancelled

### handbrake.output : `string`

A `string` containing all handbrakeCLI output

- **Type:** `string`

### handbrake.options : `object`

A copy of the options passed to `hbjs.spawn()`.

- **Type:** `object`

### handbrake.cancel() : `void`

Cancel the encode, kill the underlying HandbrakeCLI process then emit a `cancelled` event.

- **Type:** Method

### "start"

Fired as HandbrakeCLI is launched. Nothing has happened yet.

- **Type:** Event

### "begin"

Fired when encoding begins. If you're expecting an encode and this never fired, something went wrong.

- **Type:** Event

### "progress" (progress)

Fired at regular intervals passing a `progress` object.

- **Type:** Event

| Property | Type | Description |
| --- | --- | --- |
| progress | `object` | details of encode progress |
| progress.taskNumber | `number` | current task index |
| progress.taskCount | `number` | total tasks in the queue |
| progress.percentComplete | `number` | percent complete |
| progress.fps | `number` | Frames per second |
| progress.avgFps | `number` | Average frames per second |
| progress.eta | `string` | Estimated time until completion |
| progress.task | `string` | Task description, either "Encoding" or "Muxing" |


### "output" (output)

- **Type:** Event

| Property | Type | Description |
| --- | --- | --- |
| output | `string` | An aggregate of `stdout` and `stderr` output from the underlying HandbrakeCLI process. |


### "error" (error)

- **Type:** Event

| Property | Type | Description |
| --- | --- | --- |
| error | `Error | All operational exceptions are delivered via this event. |
| error.name | `eError` | The unique error identifier |
| error.message | `string` | Error description |
| error.errno | `string` | The HandbrakeCLI return code |


### handbrake.eError

All operational errors are emitted via the {@link module:handbrake-js~Handbrake#event:error} event.

| Enum | Description |
| --- | --- |
| `VALIDATION` | Thrown if you accidentally set identical input and output paths (which would clobber the input file), forget to specifiy an output path and other validation errors. |
| `INVALID_INPUT` | Thrown when the input file specified does not appear to be a video file. |
| `INVALID_PRESET` | Thrown when an invalid preset is specified. |
| `OTHER` | Thrown if Handbrake crashes |
| `NOT_FOUND` | Thrown if the installed HandbrakeCLI binary has gone missing |


* * *

&copy; 2013-26 Lloyd Brookes &lt;opensource@75lb.com&gt;.

Handbrake ([Authors](https://github.com/HandBrake/HandBrake/blob/master/AUTHORS.markdown)) is licensed by [GNU General Public License Version 2](https://github.com/HandBrake/HandBrake/blob/master/LICENSE).

