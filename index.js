/*☭
## handbrake-js

Handbrake for node.js.

- **Type:** Package
- **Module type:** Both JavaScript and CommonJS
- **Supported runtimes:** Node.Js >= v14, Deno >= v2

**Example**

```js
import hbjs from 'handbrake-js'
const result = await hbjs.run({ input: 'input.mov', output: 'output.mp4' })
```

**API Surface**

* _Named exports_
  * spawn ([options]) => `Handbrake`
  * exec (options, [onComplete]) => `void`
  * run (options) => `Promise<{ stdout: string, stderr: string }>`
* _exposed inner features_
  * ~Handbrake : `class`
    * .cancel() => `void`
    * .output : `string`
    * .options : `object`
    * .eError : `enum`
    * "start" : `event`
    * "begin" : `event`
    * "progress" (`progress`) : `event`
    * "output" (`output`) : `event`
    * "error" (`error`) : `event`
    * "end" : `event`
    * "complete" : `event`
    * "cancelled" : `event`
*/

import Handbrake from './lib/handbrake.js'
import util from 'util'
import cp from 'child_process'
import toSpawnArgs from 'object-to-spawn-args'
import { HandbrakeCLIPath } from './lib/config.js'
import cliOptions from './lib/cli-options.js'

/*☭
### hbjs.spawn (options = {}, [mocks]) => `Handbrake`

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

**Example**

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
  const handbrake = new Handbrake(options, mocks)

  /* defer so the caller can attach event listers on the returned Handbrake instance first */
  process.nextTick(function () {
    try {
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

/*☭
### hbjs.exec (options = {}, onComplete)

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

**Example**

```js
import hbjs from 'handbrake-js'
hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
  if (err) throw err
  console.log(stdout)
})
```
*/
function exec (options = {}, done) {
  const handbrakePath = options.HandbrakeCLIPath || HandbrakeCLIPath
  const optionsCopy = Object.assign({}, options)
  /* All options except HandbrakeCLIPath should be passed into the Handbrake command */
  delete optionsCopy.HandbrakeCLIPath
  const cmd = util.format(
    '"%s" %s',
    handbrakePath,
    toSpawnArgs(optionsCopy, { quote: true }).join(' ')
  )
  cp.exec(cmd, done)
}

/*☭
### hbjs.run (options) => `Promise<{ stdout: string, stderr: string }>`

Identical to `hbjs.exec` except it returns a promise, rather than invoke a callback. Use this when you don't need the progress events reported by `hbjs.spawn`. Fulfils with an object containing the output in two properties: `stdout` and `stderr`.

- **Type:** Exported, asynchronous function
- **Returns:** `Promise<{ stdout: string, stderr: string }>`

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

**Example**

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
        reject(err)
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

export default { cliOptions, spawn, exec, run }
