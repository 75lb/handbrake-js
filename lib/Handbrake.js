'use strict'
var path = require('path')
var util = require('util')
var EventEmitter = require('events').EventEmitter
var progress = require('./progress')
var toSpawnArgs = require('object-to-spawn-args')
var config = require('./config')

module.exports = Handbrake

/**
 * @class
 * @classdesc A handle on the HandbrakeCLI process. Emits events you can monitor to track progress. An instance of this class is returned by {@link module:handbrake-js.spawn}.
 * @extends external:EventEmitter
 * @emits module:handbrake-js~Handbrake#event:start
 * @emits module:handbrake-js~Handbrake#event:begin
 * @emits module:handbrake-js~Handbrake#event:progress
 * @emits module:handbrake-js~Handbrake#event:output
 * @emits module:handbrake-js~Handbrake#event:error
 * @emits module:handbrake-js~Handbrake#event:end
 * @emits module:handbrake-js~Handbrake#event:complete
 * @emits module:handbrake-js~Handbrake#event:cancelled
 * @memberof module:handbrake-js
 * @inner
 */
function Handbrake (mocks) {
  /**
   * A `string` containing all handbrakeCLI output
   * @type {string}
   */
  this.output = ''
  /* `true` while encoding  */
  this._inProgress = false
  /**
   * a copy of the options passed to {@link module:handbrake-js.spawn}
   * @type {object}
   */
  this.options = null

  /* path to the HandbrakeCLI executable downloaded by the install script */
  this.HandbrakeCLIPath = config.HandbrakeCLIPath

  /* for test scripts */
  this.cp = (mocks && mocks.cp) || require('child_process')
  this.HandbrakeCLIPath = (mocks && mocks.HandbrakeCLIPath) || this.HandbrakeCLIPath
}
util.inherits(Handbrake, EventEmitter)

/**
 * Cancel the encode, kill the underlying HandbrakeCLI process then emit a `cancelled` event.
 */
Handbrake.prototype.cancel = function () {
  var self = this
  if (this.handle) {
    this.handle.on('close', function (code, signal) {
      if (/Signal 2 received, terminating/.test(self.output)) {
        self._emitCancelled()
      }
    })
    this.handle.kill('SIGINT')
  }
}

/* ensure user has had chance to attach event listeners before calling */
Handbrake.prototype._run = function () {
  var self = this
  var err = new Error()

  if (this.options.input !== undefined && this.options.output !== undefined) {
    var pathsEqual = path.resolve(this.options.input) === path.resolve(this.options.output)
    if (pathsEqual) {
      err.name = self.eError.VALIDATION
      err.message = 'input and output paths are the same'
      this._emitError(err)
      return
    }
  }

  var spawnArgs = toSpawnArgs(this.options, { optionEqualsValue: true })

  this._emitStart()
  var handle = this.cp.spawn(this.HandbrakeCLIPath, spawnArgs)

  handle.stdout.setEncoding('utf-8')
  handle.stderr.setEncoding('utf-8')

  var buffer = ''
  handle.stdout.on('data', function (chunk) {
    buffer += chunk

    if (progress.long.pattern.test(buffer)) {
      self._emitProgress(progress.long.parse(buffer))
      buffer = buffer.replace(progress.long.pattern, '')
    } else if (progress.short.pattern.test(buffer)) {
      self._emitProgress(progress.short.parse(buffer))
      buffer = buffer.replace(progress.short.pattern, '')
    } else if (progress.muxing.pattern.test(buffer)) {
      self._emitProgress(progress.muxing.parse(buffer))
      buffer = buffer.replace(progress.muxing.pattern, '')
    }
    self._emitOutput(chunk)
  })

  handle.stderr.on('data', this._emitOutput.bind(this))

  handle.on('exit', function (code, signal) {
    /* ignore a cancelled exit, which is handled by .cancel() */
    if (/Signal 2 received, terminating/.test(self.output)) {
      return
    }

    if (code === 0) {
      if (self._inProgress) {
        var last = progress.last
        if (last) {
          last.percentComplete = 100
          self._emitProgress(last)
        }
        self._emitEnd()
      }
    } else if (code === 1) {
      err = new Error()
      err.name = self.eError.VALIDATION
      err.message = 'User input validation error [error code: ' + code + ']'
      err.errno = code
      self._emitError(err)
    } else if (code === 2) {
      err = new Error()
      err.name = self.eError.INVALID_INPUT
      err.message = 'Invalid input, not a video file [error code: ' + code + ']'
      self._emitError(err)
    } else if (code === 3) {
      err = new Error()
      err.name = self.eError.OTHER
      err.message = 'Handbrake InitialisationError [error code: ' + code + ']'
      self._emitError(err)
    } else if (code === 4) {
      err = new Error()
      err.name = self.eError.OTHER
      err.message = 'Unknown Handbrake error [error code: ' + code + ']'
      self._emitError(err)
    } else if (code === null) {
      err = new Error()
      err.name = self.eError.OTHER
      err.message = 'HandbrakeCLI crashed (Segmentation fault)'
      self._emitError(err)
    }
    self._emitComplete()
  })

  handle.on('error', function (spawnError) {
    err.errno = spawnError.errno
    err.HandbrakeCLIPath = self.HandbrakeCLIPath
    if (spawnError.code === 'ENOENT') {
      err.name = self.eError.NOT_FOUND
      err.message = 'HandbrakeCLI application not found: ' + err.HandbrakeCLIPath + '. Linux users must install HandbrakeCLI manually, please see https://handbrake.fr/downloads.php.'
      err.spawnmessage = spawnError.message
    } else {
      err.name = self.eError.OTHER
      err.message = spawnError.message
    }
    self._emitError(err)
    self._emitComplete()
  })

  this.handle = handle

  return this
}

/**
 * Fired as HandbrakeCLI is launched. Nothing has happened yet.
 * @event module:handbrake-js~Handbrake#start
 */
Handbrake.prototype._emitStart = function () {
  this.emit('start')
}

/**
 * Fired when encoding begins. If you're expecting an encode and this never fired, something went wrong.
 * @event module:handbrake-js~Handbrake#begin
 */
Handbrake.prototype._emitBegin = function () {
  this._inProgress = true
  this.emit('begin')
}

/**
 * Fired at regular intervals passing a `progress` object.
 *
 * @event module:handbrake-js~Handbrake#progress
 * @param progress {object} - details of encode progress
 * @param progress.taskNumber {number} - current task index
 * @param progress.taskCount {number} - total tasks in the queue
 * @param progress.percentComplete {number} - percent complete
 * @param progress.fps {number} - Frames per second
 * @param progress.avgFps {number} - Average frames per second
 * @param progress.eta {string} - Estimated time until completion
 * @param progress.task {string} - Task description, either "Encoding" or "Muxing"
 */
Handbrake.prototype._emitProgress = function (progress) {
  if (!this._inProgress) this._emitBegin()
  this.emit('progress', progress)
}

/**
 * @event module:handbrake-js~Handbrake#output
 * @param output {string} - An aggregate of `stdout` and `stderr` output from the underlying HandbrakeCLI process.
 */
Handbrake.prototype._emitOutput = function (output) {
  this.output += output
  this.emit('output', output)
}

/**
 * @event module:handbrake-js~Handbrake#error
 * @param error {Error} - All operational exceptions are delivered via this event.
 * @param error.name {module:handbrake-js~Handbrake#eError} - The unique error identifier
 * @param error.message {string} - Error description
 * @param error.errno {string} - The HandbrakeCLI return code
 */
Handbrake.prototype._emitError = function (err) {
  err.output = this.output
  err.options = this.options
  this.emit('error', err)
  var hbjs = require('./handbrake-js')
  hbjs._usage.exception({ exd: err.toString() })
  hbjs._usage.send({ timeout: 3000 })
    .catch(function () { /* disregard errors */ })
}

/**
 * Fired on successful completion of an encoding task. Always follows a {@link module:handbrake-js~Handbrake#event:begin} event, with some {@link module:handbrake-js~Handbrake#event:progress} in between.
 * @event module:handbrake-js~Handbrake#end
 */
Handbrake.prototype._emitEnd = function () {
  this.emit('end')
}

/**
 * Fired when HandbrakeCLI exited cleanly. This does not necessarily mean your encode completed as planned..
 * @event module:handbrake-js~Handbrake#complete
 */
Handbrake.prototype._emitComplete = function () {
  this.emit('complete')
}

/**
 * If `.cancel()` was called, this event is emitted once the underlying HandbrakeCLI process has closed.
 * @event module:handbrake-js~Handbrake#cancelled
 */
Handbrake.prototype._emitCancelled = function () {
  this.emit('cancelled')
}

/**
 * All operational errors are emitted via the {@link module:handbrake-js~Handbrake#event:error} event.
 * @enum
 * @memberof module:handbrake-js
 * @inner
 */
Handbrake.prototype.eError = {
  /**
  Thrown if you accidentally set identical input and output paths (which would clobber the input file), forget to specifiy an output path and other validation errors
  */
  VALIDATION: 'ValidationError',
  /**
  Thrown when the input file specified does not appear to be a video file
  */
  INVALID_INPUT: 'InvalidInput',
  /**
  Thrown if Handbrake crashes
  */
  OTHER: 'Other',
  /**
  Thrown if the installed HandbrakeCLI binary has gone missing..
  */
  NOT_FOUND: 'HandbrakeCLINotFound'
}

/**
 * @external EventEmitter
 * @see http://nodejs.org/api/events.html
 */
