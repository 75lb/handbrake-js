import { EventEmitter } from 'events'
import { HandbrakeCLIPath } from './config.js'
import path from 'path'
import * as progress from './progress.js'
import toSpawnArgs from 'object-to-spawn-args'
import childProcess from 'child_process'

/*☭
## hbjs~Handbrake

A handle on the HandbrakeCLI process. Emits events you can monitor to track progress. An instance of this class is returned by `hbjs.spawn()`.

- **Type:** Internal Class
- **Extends:** EventEmitter
- **Emits:** start, begin, progress, output, error, end, complete, cancelled
*/
class Handbrake extends EventEmitter {
  constructor (options = {}, mocks) {
    super()
    /*☭
    ### handbrake.output : `string`

    A `string` containing all handbrakeCLI output

    - **Type:** `string`
    */
    this.output = ''
    /* `true` while encoding  */
    this._inProgress = false

    /*☭
    ### handbrake.options : `object`

    A copy of the options passed to `hbjs.spawn()`.

    - **Type:** `object`
    */
    this.options = options

    /* path to the HandbrakeCLI executable downloaded by the install script */
    this.HandbrakeCLIPath = options.HandbrakeCLIPath || HandbrakeCLIPath

    /* for test scripts */
    this.cp = (mocks && mocks.cp) || childProcess
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
          this._emitCancelled()
        }
      })
      this.handle.kill('SIGINT')
    }
  }

  /* ensure user has had chance to attach event listeners before calling */
  _run () {
    let err = new Error()

    if (this.options.input !== undefined && this.options.output !== undefined) {
      const pathsEqual = path.resolve(this.options.input) === path.resolve(this.options.output)
      if (pathsEqual) {
        err.name = this.eError.VALIDATION
        err.message = 'input and output paths are the same'
        this._emitError(err)
        return
      }
    }

    const optionsCopy = Object.assign({}, this.options)
    /* All options except HandbrakeCLIPath should be passed into the Handbrake command */
    delete optionsCopy.HandbrakeCLIPath
    const spawnArgs = toSpawnArgs(optionsCopy, {
      optionEqualsValue: true,
      optionEqualsValueExclusions: ['preset-import-file', 'preset-import-gui', 'subtitle-burned']
    })
    this._emitStart()
    const handle = this.cp.spawn(this.HandbrakeCLIPath, spawnArgs)
    handle.stdout.setEncoding('utf-8')

    let buffer = ''
    handle.stdout.on('data', chunk => {
      buffer += chunk

      if (progress.long.pattern.test(buffer)) {
        this._emitProgress(progress.long.parse(buffer))
        buffer = buffer.replace(progress.long.pattern, '')
      } else if (progress.short.pattern.test(buffer)) {
        this._emitProgress(progress.short.parse(buffer))
        buffer = buffer.replace(progress.short.pattern, '')
      } else if (progress.muxing.pattern.test(buffer)) {
        this._emitProgress(progress.muxing.parse(buffer))
        buffer = buffer.replace(progress.muxing.pattern, '')
      }
      this._emitOutput(chunk)
    })

    handle.stderr.on('data', this._emitOutput.bind(this))

    handle.on('exit', (code, signal) => {
      /* ignore a cancelled exit, which is handled by .cancel() */
      /* the first test is for mac/linux, second for windows */
      if (/Signal 2 received, terminating/.test(this.output) || (code === null && signal === 'SIGINT')) {
        return
      }

      if (code === 0) {
        if (this._inProgress) {
          const last = progress.last
          if (last) {
            last.percentComplete = 100
            this._emitProgress(last)
          }
          this._emitEnd()
        }
      } else if (code === 1) {
        err = new Error()
        err.name = this.eError.VALIDATION
        err.message = 'User input validation error [error code: ' + code + ']'
        err.errno = code
        this._emitError(err)
      } else if (code === 2) {
        err = new Error()
        if (/invalid preset/i.test(this.output)) {
          err.name = this.eError.INVALID_PRESET
          err.message = 'Invalid preset [error code: ' + code + ']'
        } else {
          err.name = this.eError.INVALID_INPUT
          err.message = 'Invalid input, not a video file [error code: ' + code + ']'
        }
        this._emitError(err)
      } else if (code === 3) {
        err = new Error()
        err.name = this.eError.OTHER
        err.message = 'Handbrake InitialisationError [error code: ' + code + ']'
        this._emitError(err)
      } else if (code === 4) {
        err = new Error()
        err.name = this.eError.OTHER
        err.message = 'Unknown Handbrake error [error code: ' + code + ']'
        this._emitError(err)
      } else if (code === null) {
        err = new Error()
        err.name = this.eError.OTHER
        err.message = 'HandbrakeCLI crashed (Segmentation fault)'
        this._emitError(err)
      }
      this._emitComplete()
    })

    handle.on('error', spawnError => {
      err.errno = spawnError.errno
      err.HandbrakeCLIPath = this.HandbrakeCLIPath
      if (spawnError.code === 'ENOENT') {
        err.name = this.eError.NOT_FOUND
        err.message = 'HandbrakeCLI application not found: ' + err.HandbrakeCLIPath
        err.spawnmessage = spawnError.message
      } else {
        err.name = this.eError.OTHER
        err.message = spawnError.message
      }
      this._emitError(err)
      this._emitComplete()
    })

    this.handle = handle
  }

  /*☭
  ### "start"

  Fired as HandbrakeCLI is launched. Nothing has happened yet.

  - **Type:** Event
  */
  _emitStart () {
    this.emit('start')
  }

  /*☭
  ### "begin"

  Fired when encoding begins. If you're expecting an encode and this never fired, something went wrong.

  - **Type:** Event
  */
  _emitBegin () {
    this._inProgress = true
    this.emit('begin')
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
    if (!this._inProgress) this._emitBegin()
    this.emit('progress', progress)
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
    this.output += output
    if (/unknown option/.test(output.toString())) {
      const err = new Error()
      err.name = this.eError.OTHER
      err.message = 'HandbrakeCLI reported "unknown option", please report this issue: https://github.com/75lb/handbrake-js/issues/new'
      this._emitError(err)
    } else {
      this.emit('output', output)
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
    err.output = this.output
    err.options = this.options
    this.emit('error', err)
  }

  /**
  * Fired on successful completion of an encoding task. Always follows a {@link module:handbrake-js~Handbrake#event:begin} event, with some {@link module:handbrake-js~Handbrake#event:progress} in between.
  * @event module:handbrake-js~Handbrake#end
  */
  _emitEnd () {
    this.emit('end')
  }

  /**
  * Fired when HandbrakeCLI exited cleanly. This does not necessarily mean your encode completed as planned..
  * @event module:handbrake-js~Handbrake#complete
  */
  _emitComplete () {
    this.emit('complete')
  }

  /**
  * If `.cancel()` was called, this event is emitted once the underlying HandbrakeCLI process has closed.
  * @event module:handbrake-js~Handbrake#cancelled
  */
  _emitCancelled () {
    this.emit('cancelled')
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
}

export default Handbrake
