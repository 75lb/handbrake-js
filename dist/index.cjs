'use strict';

var events = require('events');
var path = require('path');
var currentModulePaths = require('current-module-paths');
var toSpawnArgs = require('object-to-spawn-args');
var childProcess = require('child_process');
var util = require('util');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
const { __dirname: __dirname$1 } = currentModulePaths((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href)));

/* path to the HandbrakeCLI executable downloaded by the install script */
let HandbrakeCLIPath = null;

if (process.env.HANDBRAKECLI_PATH) {
  HandbrakeCLIPath = process.env.HANDBRAKECLI_PATH;
} else {
  switch (process.platform) {
    case 'darwin':
      HandbrakeCLIPath = path.join(__dirname$1, '..', 'bin', 'HandbrakeCLI');
      break
    case 'win32':
      HandbrakeCLIPath = path.join(__dirname$1, '..', 'bin', 'HandbrakeCLI.exe');
      break
    case 'linux':
      HandbrakeCLIPath = 'HandBrakeCLI';
      break
  }
}

let last = null;

const short = {
  pattern: /\rEncoding: task (\d) of (\d), (.+) %/,
  parse: function (progressString) {
    const match = progressString.match(this.pattern);
    if (match) {
      const data = last = {
        taskNumber: +match[1],
        taskCount: +match[2],
        percentComplete: +match[3],
        fps: 0,
        avgFps: 0,
        eta: '',
        task: 'Encoding'
      };
      return data
    }
  }
};

const long = {
  pattern: /\rEncoding: task (\d) of (\d), (.+) % \((.+) fps, avg (.+) fps, ETA (.+)\)/,
  parse: function (progressString) {
    const match = progressString.match(this.pattern);
    if (match) {
      const data = last = {
        taskNumber: +match[1],
        taskCount: +match[2],
        percentComplete: +match[3],
        fps: +match[4],
        avgFps: +match[5],
        eta: match[6],
        task: 'Encoding'
      };
      return data
    }
  }
};

const muxing = {
  pattern: /\rMuxing: this may take awhile.../,
  parse: function (progressString) {
    const match = progressString.match(this.pattern);
    if (match) {
      const data = last = {
        taskNumber: 0,
        taskCount: 0,
        percentComplete: 0,
        fps: 0,
        avgFps: 0,
        eta: '',
        task: 'Muxing'
      };
      return data
    }
  }
};

/*☭
## hbjs~Handbrake

A handle on the HandbrakeCLI process. Emits events you can monitor to track progress. An instance of this class is returned by `hbjs.spawn()`.

- **Type:** Internal Class
- **Extends:** EventEmitter
- **Emits:** start, begin, progress, output, error, end, complete, cancelled
*/
class Handbrake extends events.EventEmitter {
  constructor (options = {}, mocks) {
    super();
    /*☭
    ### handbrake.output : `string`

    A `string` containing all handbrakeCLI output

    - **Type:** `string`
    */
    this.output = '';
    /* `true` while encoding  */
    this._inProgress = false;

    /*☭
    ### handbrake.options : `object`

    A copy of the options passed to `hbjs.spawn()`.

    - **Type:** `object`
    */
    this.options = options;

    /* path to the HandbrakeCLI executable downloaded by the install script */
    this.HandbrakeCLIPath = options.HandbrakeCLIPath || HandbrakeCLIPath;

    /* for test scripts */
    this.cp = (mocks && mocks.cp) || childProcess;
  }

  /*☭
  ### handbrake.cancel() : `void`

  Cancel the encode, kill the underlying HandbrakeCLI process then emit a `cancelled` event.

  - **Type:** Method
  */
  cancel () {
    if (this.handle) {
      this.handle.on('close', (code, signal) => {
        /* the first test is for mac/linux, second for windows */
        if (/Signal 2 received, terminating/.test(this.output) || (code === null && signal === 'SIGINT')) {
          this._emitCancelled();
        }
      });
      this.handle.kill('SIGINT');
    }
  }

  /* ensure user has had chance to attach event listeners before calling */
  _run () {
    let err = new Error();

    if (this.options.input !== undefined && this.options.output !== undefined) {
      const pathsEqual = path.resolve(this.options.input) === path.resolve(this.options.output);
      if (pathsEqual) {
        err.name = this.eError.VALIDATION;
        err.message = 'input and output paths are the same';
        this._emitError(err);
        return
      }
    }

    const optionsCopy = Object.assign({}, this.options);
    /* All options except HandbrakeCLIPath should be passed into the Handbrake command */
    delete optionsCopy.HandbrakeCLIPath;
    const spawnArgs = toSpawnArgs(optionsCopy, {
      optionEqualsValue: true,
      optionEqualsValueExclusions: ['preset-import-file', 'preset-import-gui', 'subtitle-burned']
    });
    this._emitStart();
    const handle = this.cp.spawn(this.HandbrakeCLIPath, spawnArgs);
    handle.stdout.setEncoding('utf-8');

    let buffer = '';
    handle.stdout.on('data', chunk => {
      buffer += chunk;

      if (long.pattern.test(buffer)) {
        this._emitProgress(long.parse(buffer));
        buffer = buffer.replace(long.pattern, '');
      } else if (short.pattern.test(buffer)) {
        this._emitProgress(short.parse(buffer));
        buffer = buffer.replace(short.pattern, '');
      } else if (muxing.pattern.test(buffer)) {
        this._emitProgress(muxing.parse(buffer));
        buffer = buffer.replace(muxing.pattern, '');
      }
      this._emitOutput(chunk);
    });

    handle.stderr.on('data', this._emitOutput.bind(this));

    handle.on('exit', (code, signal) => {
      /* ignore a cancelled exit, which is handled by .cancel() */
      /* the first test is for mac/linux, second for windows */
      if (/Signal 2 received, terminating/.test(this.output) || (code === null && signal === 'SIGINT')) {
        return
      }

      if (code === 0) {
        if (this._inProgress) {
          const last$1 = last;
          if (last$1) {
            last$1.percentComplete = 100;
            this._emitProgress(last$1);
          }
          this._emitEnd();
        }
      } else if (code === 1) {
        err = new Error();
        err.name = this.eError.VALIDATION;
        err.message = 'User input validation error [error code: ' + code + ']';
        err.errno = code;
        this._emitError(err);
      } else if (code === 2) {
        err = new Error();
        if (/invalid preset/i.test(this.output)) {
          err.name = this.eError.INVALID_PRESET;
          err.message = 'Invalid preset [error code: ' + code + ']';
        } else {
          err.name = this.eError.INVALID_INPUT;
          err.message = 'Invalid input, not a video file [error code: ' + code + ']';
        }
        this._emitError(err);
      } else if (code === 3) {
        err = new Error();
        err.name = this.eError.OTHER;
        err.message = 'Handbrake InitialisationError [error code: ' + code + ']';
        this._emitError(err);
      } else if (code === 4) {
        err = new Error();
        err.name = this.eError.OTHER;
        err.message = 'Unknown Handbrake error [error code: ' + code + ']';
        this._emitError(err);
      } else if (code === null) {
        err = new Error();
        err.name = this.eError.OTHER;
        err.message = 'HandbrakeCLI crashed (Segmentation fault)';
        this._emitError(err);
      }
      this._emitComplete();
    });

    handle.on('error', spawnError => {
      err.errno = spawnError.errno;
      err.HandbrakeCLIPath = this.HandbrakeCLIPath;
      if (spawnError.code === 'ENOENT') {
        err.name = this.eError.NOT_FOUND;
        err.message = 'HandbrakeCLI application not found: ' + err.HandbrakeCLIPath;
        err.spawnmessage = spawnError.message;
      } else {
        err.name = this.eError.OTHER;
        err.message = spawnError.message;
      }
      this._emitError(err);
      this._emitComplete();
    });

    this.handle = handle;
  }

  /*☭
  ### "start"

  Fired as HandbrakeCLI is launched. Nothing has happened yet.

  - **Type:** Event
  */
  _emitStart () {
    this.emit('start');
  }

  /*☭
  ### "begin"

  Fired when encoding begins. If you're expecting an encode and this never fired, something went wrong.

  - **Type:** Event
  */
  _emitBegin () {
    this._inProgress = true;
    this.emit('begin');
  }

  /*☭
  ### "progress" (progress)

  Fired at regular intervals passing a `progress` object.

  - **Type:** Event

  ¬
    Property
    Type
    Description
  ¬
    progress
    `object`
    details of encode progress
  ¬
    progress.taskNumber
    `number`
    current task index
  ¬
    progress.taskCount
    `number`
    total tasks in the queue
  ¬
    progress.percentComplete
    `number`
    percent complete
  ¬
    progress.fps
    `number`
    Frames per second
  ¬
    progress.avgFps
    `number`
    Average frames per second
  ¬
    progress.eta
    `string`
    Estimated time until completion
  ¬
    progress.task
    `string`
    Task description, either "Encoding" or "Muxing"
  ¬
  */
  _emitProgress (progress) {
    if (!this._inProgress) this._emitBegin();
    this.emit('progress', progress);
  }

  /*☭
  ### "output" (output)

  - **Type:** Event

  ¬
    Property
    Type
    Description
  ¬
    output
    `string`
    An aggregate of `stdout` and `stderr` output from the underlying HandbrakeCLI process.
  ¬
  */
  _emitOutput (output) {
    this.output += output;
    if (/unknown option/.test(output.toString())) {
      const err = new Error();
      err.name = this.eError.OTHER;
      err.message = 'HandbrakeCLI reported "unknown option", please report this issue: https://github.com/75lb/handbrake-js/issues/new';
      this._emitError(err);
    } else {
      this.emit('output', output);
    }
  }

  /*☭
  ### "error" (error)

  - **Type:** Event

  ¬
    Property
    Type
    Description
  ¬
    error
    `Error
    All operational exceptions are delivered via this event.
  ¬
    error.name
    `eError`
    The unique error identifier
  ¬
    error.message
    `string`
    Error description
  ¬
    error.errno
    `string`
    The HandbrakeCLI return code
  ¬
  */
  _emitError (err) {
    err.output = this.output;
    err.options = this.options;
    this.emit('error', err);
  }

  /**
  * Fired on successful completion of an encoding task. Always follows a {@link module:handbrake-js~Handbrake#event:begin} event, with some {@link module:handbrake-js~Handbrake#event:progress} in between.
  * @event module:handbrake-js~Handbrake#end
  */
  _emitEnd () {
    this.emit('end');
  }

  /**
  * Fired when HandbrakeCLI exited cleanly. This does not necessarily mean your encode completed as planned..
  * @event module:handbrake-js~Handbrake#complete
  */
  _emitComplete () {
    this.emit('complete');
  }

  /**
  * If `.cancel()` was called, this event is emitted once the underlying HandbrakeCLI process has closed.
  * @event module:handbrake-js~Handbrake#cancelled
  */
  _emitCancelled () {
    this.emit('cancelled');
  }
}

/*☭
### handbrake.eError

All operational errors are emitted via the {@link module:handbrake-js~Handbrake#event:error} event.

¬
  Enum
  Description
¬
  `VALIDATION`
  Thrown if you accidentally set identical input and output paths (which would clobber the input file), forget to specifiy an output path and other validation errors.
¬
  `INVALID_INPUT`
   Thrown when the input file specified does not appear to be a video file.
¬
  `INVALID_PRESET`
  Thrown when an invalid preset is specified.
¬
  `OTHER`
  Thrown if Handbrake crashes
¬
  `NOT_FOUND`
  Thrown if the installed HandbrakeCLI binary has gone missing
¬
*/
Handbrake.prototype.eError = {
  VALIDATION: 'ValidationError',
  INVALID_INPUT: 'InvalidInput',
  INVALID_PRESET: 'InvalidPreset',
  OTHER: 'Other',
  NOT_FOUND: 'HandbrakeCLINotFound'
};

var cliOptions = [
  { name: 'help', type: Boolean, alias: 'h', group: 'general' },
  { name: 'version', type: Boolean, group: 'general' },
  { name: 'verbose', type: Boolean, alias: 'v', group: 'general' },
  { name: 'preset', type: String, alias: 'Z', group: 'general' },
  { name: 'preset-list', type: Boolean, alias: 'z', group: 'general' },
  { name: 'preset-import-file', type: String, group: 'general' },
  { name: 'preset-export', type: String, group: 'general' },
  { name: 'no-dvdnav', type: Boolean, group: 'general' },
  { name: 'no-opencl', type: Boolean, group: 'general' },

  { name: 'input', type: String, alias: 'i', group: 'source' },
  { name: 'title', type: Number, alias: 't', group: 'source' },
  { name: 'min-duration', type: Number, group: 'source' },
  { name: 'scan', type: Boolean, group: 'source' },
  { name: 'main-feature', type: Boolean, group: 'source' },
  { name: 'chapters', type: String, alias: 'c', group: 'source' },
  { name: 'angle', type: Number, group: 'source' },
  { name: 'previews', type: String, group: 'source' },
  { name: 'start-at-preview', type: String, group: 'source' },
  { name: 'start-at', type: String, group: 'source' },
  { name: 'stop-at', type: String, group: 'source' },

  { name: 'output', type: String, alias: 'o', group: 'destination' },
  { name: 'format', type: String, alias: 'f', group: 'destination' },
  { name: 'markers', type: Boolean, alias: 'm', group: 'destination' },
  { name: 'no-markers', type: Boolean, group: 'destination' },
  { name: 'optimize', type: Boolean, alias: 'O', group: 'destination' },
  { name: 'ipod-atom', type: Boolean, alias: 'I', group: 'destination' },
  { name: 'no-ipod-atom', type: Boolean, group: 'destination' },
  { name: 'use-opencl', type: Boolean, alias: 'P', group: 'destination' },

  { name: 'encoder', type: String, alias: 'e', group: 'video' },
  { name: 'encoder-preset', type: String, group: 'video' },
  { name: 'encoder-preset-list', type: String, group: 'video' },
  { name: 'encoder-tune', type: String, group: 'video' },
  { name: 'encoder-tune-list', type: String, group: 'video' },
  { name: 'encopts', type: String, alias: 'x', group: 'video' },
  { name: 'encoder-profile', type: String, group: 'video' },
  { name: 'encoder-profile-list', type: String, group: 'video' },
  { name: 'encoder-level', type: String, group: 'video' },
  { name: 'encoder-level-list', type: String, group: 'video' },
  { name: 'quality', type: Number, alias: 'q', group: 'video' },
  { name: 'vb', type: Number, alias: 'b', group: 'video' },
  { name: 'two-pass', type: Boolean, group: 'video' },
  { name: 'no-two-pass', type: Boolean, group: 'video' },
  { name: 'turbo', type: Boolean, alias: 'T', group: 'video' },
  { name: 'no-turbo', type: Boolean, group: 'video' },
  { name: 'rate', type: Number, alias: 'r', group: 'video' },
  { name: 'vfr', type: Boolean, group: 'video' },
  { name: 'cfr', type: Boolean, group: 'video' },
  { name: 'pfr', type: Boolean, group: 'video' },

  { name: 'audio-lang-list', type: String, group: 'audio' },
  { name: 'all-audio', type: Boolean, group: 'audio' },
  { name: 'first-audio', type: Boolean, group: 'audio' },
  { name: 'audio', type: String, alias: 'a', group: 'audio' },
  { name: 'aencoder', type: String, alias: 'E', group: 'audio' },
  { name: 'audio-copy-mask', type: String, group: 'audio' },
  { name: 'audio-fallback', type: String, group: 'audio' },
  { name: 'ab', type: String, alias: 'B', group: 'audio' },
  { name: 'aq', type: String, alias: 'Q', group: 'audio' },
  { name: 'ac', type: String, alias: 'C', group: 'audio' },
  { name: 'mixdown', type: String, group: 'audio' },
  { name: 'normalize-mix', type: String, group: 'audio' },
  { name: 'arate', type: String, alias: 'R', group: 'audio' },
  { name: 'drc', type: Number, alias: 'D', group: 'audio' },
  { name: 'gain', type: Number, group: 'audio' },
  { name: 'adither', type: String, group: 'audio' },
  { name: 'aname', type: String, alias: 'A', group: 'audio' },

  { name: 'width', type: Number, alias: 'w', group: 'picture' },
  { name: 'height', type: Number, alias: 'l', group: 'picture' },
  { name: 'crop', type: String, group: 'picture' },
  { name: 'loose-crop', type: Boolean, group: 'picture' },
  { name: 'no-loose-crop', type: Boolean, group: 'picture' },
  { name: 'maxHeight', type: Number, alias: 'Y', group: 'picture' },
  { name: 'maxWidth', type: Number, alias: 'X', group: 'picture' },
  { name: 'non-anamorphic', type: Boolean, group: 'picture' },
  { name: 'auto-anamorphic', type: Boolean, group: 'picture' },
  { name: 'loose-anamorphic', type: Boolean, group: 'picture' },
  { name: 'custom-anamorphic', type: Boolean, group: 'picture' },
  { name: 'display-width', type: Number, group: 'picture' },
  { name: 'keep-display-aspect', type: Boolean, group: 'picture' },
  { name: 'pixel-aspect', type: String, group: 'picture' },
  { name: 'itu-par', type: Boolean, group: 'picture' },
  { name: 'modulus', type: Number, group: 'picture' },
  { name: 'color-matrix', type: String, alias: 'M', group: 'picture' },

  { name: 'comb-detect', type: String, group: 'filters' },
  { name: 'no-comb-detect', type: Boolean, group: 'filters' },
  { name: 'deinterlace', type: String, alias: 'd', group: 'filters' },
  { name: 'no-deinterlace', type: Boolean, group: 'filters' },
  { name: 'decomb', type: String, group: 'filters' },
  { name: 'no-decomb', type: Boolean, group: 'filters' },
  { name: 'detelecine', type: String, group: 'filters' },
  { name: 'no-detelecine', type: Boolean, group: 'filters' },
  { name: 'hqdn3d', type: String, group: 'filters' },
  { name: 'no-hqdn3d', type: Boolean, group: 'filters' },
  { name: 'denoise', type: String, group: 'filters' },
  { name: 'nlmeans', type: String, group: 'filters' },
  { name: 'no-nlmeans', type: Boolean, group: 'filters' },
  { name: 'nlmeans-tune', type: String, group: 'filters' },
  { name: 'deblock', type: String, group: 'filters' },
  { name: 'no-deblock', type: Boolean, group: 'filters' },
  { name: 'rotate', type: String, group: 'filters' },
  { name: 'pad', type: String, group: 'filters' },
  { name: 'grayscale', type: Boolean, alias: 'g', group: 'filters' },
  { name: 'no-grayscale', type: Boolean, group: 'filters' },

  { name: 'subtitle-lang-list', type: String, group: 'subtitle' },
  { name: 'all-subtitles', type: Boolean, group: 'subtitle' },
  { name: 'first-subtitles', type: Boolean, group: 'subtitle' },
  { name: 'subtitle', type: String, alias: 's', group: 'subtitle' },
  { name: 'subtitle-forced', type: Number, alias: 'F', group: 'subtitle' },
  { name: 'subtitle-burned', type: Number, group: 'subtitle' },
  { name: 'subtitle-default', type: Number, group: 'subtitle' },
  { name: 'native-language', type: String, alias: 'N', group: 'subtitle' },
  { name: 'native-dub', type: Boolean, group: 'subtitle' },
  { name: 'srt-file', type: String, group: 'subtitle' },
  { name: 'srt-codeset', type: String, group: 'subtitle' },
  { name: 'srt-offset', type: String, group: 'subtitle' },
  { name: 'srt-lang', type: String, group: 'subtitle' },
  { name: 'srt-default', type: Number, group: 'subtitle' },
  { name: 'srt-burn', type: Number, group: 'subtitle' }
];

/*☭
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
*/


/*☭
### hbjs.spawn (options = {}, [mocks]) : `Handbrake`

Spawns a HandbrakeCLI process with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options), returning an instance of `Handbrake` on which you can listen for progress events.

- **Type:** Exported, synchronous function
- **Returns:** `Handbrake`

¬
  Param
  Type
  Description
¬
  [options]
  `object`
  [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI
¬
  [options.HandbrakeCLIPath]
  `string`
  Override the built-in `HandbrakeCLI` binary path.
¬

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
*/

function spawn (options = {}, mocks) {
  const handbrake = new Handbrake(options, mocks);

  /* defer so the caller can attach event listers on the returned Handbrake instance first */
  process.nextTick(function () {
    try {
      handbrake._run();
    } catch (error) {
      const err = new Error();
      err.message = error.message;
      err.name = 'InvalidOption';
      handbrake._emitError(err);
    }
  });

  return handbrake
}

/*☭
### hbjs.exec (options = {}, onComplete) : void

Runs HandbrakeCLI with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

- **Type:** Exported, synchronous function

¬
  Param
  Type
  Description
¬
  options
  `object`
  [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI
¬
  [options.HandbrakeCLIPath]
  `string`
  Override the built-in `HandbrakeCLI` binary path.
¬
  [onComplete]
  `Function`
  If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output.
¬

#### Example

```js
import hbjs from 'handbrake-js'
hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
  if (err) throw err
  console.log(stdout)
})
```
*/
function exec (options = {}, done) {
  const handbrakePath = options.HandbrakeCLIPath || HandbrakeCLIPath;
  const optionsCopy = Object.assign({}, options);
  /* All options except HandbrakeCLIPath should be passed into the Handbrake command */
  delete optionsCopy.HandbrakeCLIPath;
  const cmd = util.format(
    '"%s" %s',
    handbrakePath,
    toSpawnArgs(optionsCopy, { quote: true }).join(' ')
  );
  childProcess.exec(cmd, done);
}

/*☭
### hbjs.run (options) : Promise<{ stdout: string, stderr: string }>

Identical to `hbjs.exec` except it returns a promise, rather than invoke a callback. Use this when you don't need the progress events reported by `hbjs.spawn`. Fulfils with an object containing the output in two properties: `stdout` and `stderr`.

- **Type:** Exported, asynchronous function
- **Returns:** `Promise`
- **Fulfils:** `{ stdout, stderr }`

¬
  Param
  Type
  Description
¬
  options
  `objec`
  [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI
¬
  [options.HandbrakeCLIPath]
  `string`
  Override the built-in `HandbrakeCLI` binary path.
¬

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
*/
async function run (options) {
  return new Promise((resolve, reject) => {
    exec(options, function (err, stdout, stderr) {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  })
}

var index = { cliOptions, spawn, exec, run };

module.exports = index;
