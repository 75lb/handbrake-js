import TestRunner from 'test-runner'
import * as hbjs from 'handbrake-js'
import { strict as a } from 'assert'

const tom = new TestRunner.Tom()

tom.test('--preset-list', async function () {
  return new Promise((resolve, reject) => {
    hbjs.exec({ 'preset-list': true }, function (err, stdout, stderr) {
      if (err) {
        reject(err)
      } else {
        a.ok(/Devices/.test(stderr))
        resolve()
      }
    })
  })
})

tom.test('HandbrakeCLIPath', async function () {
  return new Promise((resolve, reject) => {
    hbjs.exec({ 'preset-list': true, HandbrakeCLIPath: 'one' }, function (err, stdout, stderr) {
      if (err) {
        a.equal(err.cmd, '"one" --preset-list --HandbrakeCLIPath "one"')
        resolve()
      } else {
        reject(new Error("Shouldn't reach here"))
      }
    })
  })
})

export default tom
