'use strict'
var Handbrake = require('./Handbrake')
var util = require('util')
var cp = require('child_process')
var toSpawnArgs = require('object-to-spawn-args')
var config = require('./config')
var cliOptions = require('./cli-options')

/**
 * Handbrake for node.js.
 * @module handbrake-js
 * @typicalname hbjs
 * @example
 * ```js
 * var hbjs = require("handbrake-js")
 * ```
 */
exports.spawn = spawn
exports.exec = exec

/**
 * [Command-line-args](https://github.com/75lb/command-line-args) option definitions, useful when building a  * CLI.
 * @type {array}
 * @ignore
 */
exports.cliOptions = cliOptions

/**
 * Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide#options), returning an instance of `Handbrake` on which you can listen for events.
 *
 * @param {object} [options] - [Options](https://trac.handbrake.fr/wiki/CLIGuide#options) to pass directly to HandbrakeCLI
 * @returns {module:handbrake-js~Handbrake}
 * @alias module:handbrake-js.spawn
 * @example
 * ```js
 * var hbjs = require("handbrake-js")
 *
 * hbjs.spawn(options)
 *     .on("error", console.error)
 *     .on("output", console.log)
 * ```
 */
function spawn (options, mocks) {
  var handbrake = new Handbrake(mocks)

  /* defer so the caller can attach event listers on the returned Handbrake instance first */
  process.nextTick(function () {
    try {
      handbrake.options = options
      handbrake._run()
    } catch (error) {
      var err = new Error()
      err.message = error.message
      err.name = 'InvalidOption'
      handbrake._emitError(err)
    }
  })

  return handbrake
}

/**
 * Runs HandbrakeCLI with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide#options) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.
 *
 * @param options {Object} - [Options](https://trac.handbrake.fr/wiki/CLIGuide#options) to pass directly to HandbrakeCLI
 * @param [onComplete] {Function} - If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output.
 *
 * @example
 * ```js
 * var hbjs = require("handbrake-js")
 *
 * hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
 *     if (err) throw err
 *     console.log(stdout)
 * })
 * ```
 * @alias module:handbrake-js.exec
 */
function exec (options, done) {
  var cmd = util.format(
    '"%s" %s',
    config.HandbrakeCLIPath,
    toSpawnArgs(options, { quote: true }).join(' ')
  )
  cp.exec(cmd, done)
}
