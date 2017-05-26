'use strict'
var Handbrake = require('./Handbrake')
var util = require('util')
var cp = require('child_process')
var toSpawnArgs = require('object-to-spawn-args')
var config = require('./config')
var cliOptions = require('./cli-options')
var Usage = require('usage-stats')
var os = require('os')

var usage = exports._usage = new Usage('UA-70853320-7', {
  an: 'handbrake-js',
  av: require('../package').version
})
usage.defaults
  .set('cd1', process.version)
  .set('cd2', os.type())
  .set('cd3', os.release())
  .set('cd4', 'api')

/**
 * Handbrake for node.js.
 * @module handbrake-js
 * @typicalname hbjs
 * @example
 * ```js
 * var hbjs = require('handbrake-js')
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
 * Spawns a HandbrakeCLI process with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options), returning an instance of `Handbrake` on which you can listen for events.
 *
 * @param {object} [options] - [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI
 * @returns {module:handbrake-js~Handbrake}
 * @alias module:handbrake-js.spawn
 * @example
 * ```js
 * var hbjs = require('handbrake-js')
 *
 * var options = {
 *   input: 'something.avi',
 *   output: 'something.mp4',
 *   preset: 'Normal',
 *   rotate: 1
 * }
 * hbjs.spawn(options)
 *   .on('error', console.error)
 *   .on('output', console.log)
 * ```
 */
function spawn (options, mocks) {
  var handbrake = new Handbrake(mocks)
  screenView('spawn', options)

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
 * Runs HandbrakeCLI with the supplied [options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.
 *
 * @param options {Object} - [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI
 * @param [onComplete] {Function} - If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output.
 *
 * @example
 * ```js
 * var hbjs = require('handbrake-js')
 *
 * hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
 *   if (err) throw err
 *   console.log(stdout)
 * })
 * ```
 * @alias module:handbrake-js.exec
 */
function exec (options, done) {
  screenView('exec', options)
  var cmd = util.format(
    '"%s" %s',
    config.HandbrakeCLIPath,
    toSpawnArgs(options, { quote: true }).join(' ')
  )
  cp.exec(cmd, done)
}

function screenView (name, options) {
  if (options['no-usage-stats']) {
    /* skip recording stats.. finished with the option, remove it. */
    delete options['no-usage-stats']
  } else {
    usage.screenView(name)
    for (var prop in options) {
      if ([ 'input', 'output' ].indexOf(prop) === -1) {
        usage.event('option', prop, { hitParams: { cd: name } })
      }
    }
    usage.send({ timeout: 3000 })
      .catch(function () { /* disregard errors */ })
  }
}
