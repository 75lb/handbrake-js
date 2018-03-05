'use strict'
const Handbrake = require('./lib/Handbrake')
const util = require('util')
const cp = require('child_process')
const toSpawnArgs = require('object-to-spawn-args')
const config = require('./lib/config')
const cliOptions = require('./lib/cli-options')
const Usage = require('usage-stats')
const os = require('os')

const usage = exports._usage = new Usage('UA-70853320-7', {
  an: 'handbrake-js',
  av: require('./package').version
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
 * const hbjs = require('handbrake-js')
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
 * const hbjs = require('handbrake-js')
 *
 * const options = {
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
  const handbrake = new Handbrake(mocks)
  screenView('spawn', options)

  /* defer so the caller can attach event listers on the returned Handbrake instance first */
  process.nextTick(function () {
    try {
      handbrake.options = options
      handbrake._run()
    } catch (error) {
      const err = new Error()
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
 * const hbjs = require('handbrake-js')
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
  const cmd = util.format(
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
    for (const prop in options) {
      if ([ 'input', 'output' ].indexOf(prop) === -1) {
        usage.event('option', prop, { hitParams: { cd: name } })
      }
    }
    usage.send({ timeout: 3000 })
      .catch(function () { /* disregard errors */ })
  }
}
