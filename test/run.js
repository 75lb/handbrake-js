import * as hbjs from 'handbrake-js'
import { strict as a } from 'assert'

const test = new Map()

test.set('run: --version', async function () {
  const result = await hbjs.run({ version: true })
  console.debug('run: --version', result)
  a.ok(result.stdout)
  a.ok(result.stderr)
})

export { test }
