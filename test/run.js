import TestRunner from 'test-runner'
import * as hbjs from 'handbrake-js'
import { strict as a } from 'assert'

const tom = new TestRunner.Tom()

tom.test('run: --version', async function () {
  const result = await hbjs.run({ version: true })
  this.data = result
  a.ok(result.stdout)
  a.ok(result.stderr)
})

export default tom
