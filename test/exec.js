import TestRunner from 'test-runner'
import * as hbjs from 'handbrake-js'
import { strict as a } from 'assert'

const tom = new TestRunner.Tom()

tom.test('exec: --preset-list', async function () {
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

export default tom
