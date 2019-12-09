/**
 * Handbrake for node.js.
 * @module handbrake-js
 * @typicalname hbjs
 * @example
 * ```js
 * const hbjs = require('handbrake-js')
 * ```
 */

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
  const Handbrake = require('./lib/Handbrake')
  const handbrake = new Handbrake(mocks)

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
  const util = require('util')
  const cp = require('child_process')
  const toSpawnArgs = require('object-to-spawn-args')
  const config = require('./lib/config')
  const cmd = util.format(
    '"%s" %s',
    config.HandbrakeCLIPath,
    toSpawnArgs(options, { quote: true }).join(' ')
  )
  cp.exec(cmd, done)
}

/**
 * Identical to `hbjs.exec` except it returns a promise, rather than invoke a callback. Use this when you don't need the progress events reported by `hbjs.spawn`. Fulfils with an object containing the output in two properties: `stdout` and `stderr`.
 * @param options {Object} - [Options](https://handbrake.fr/docs/en/latest/cli/cli-guide.html#options) to pass directly to HandbrakeCLI
 * @returns {Promise}
 * @example
 * ```js
 * const hbjs = require('handbrake-js')
 *
 * async function start () {
 *   const result = await hbjs.run({ version: true })
 *   console.log(result.stdout)
 *   // prints 'HandBrake 1.3.0'
 * }
 *
 * start().catch(console.error)
 * ```
 * @alias module:handbrake-js.run
 */
async function run (options) {
  return new Promise((resolve, reject) => {
    exec(options, function (err, stdout, stderr) {
      if (err) {
        reject(err)
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

exports.spawn = spawn
exports.exec = exec
exports.run = run
exports.cliOptions = require('./lib/cli-options')
