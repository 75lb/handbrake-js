import * as hbjs from 'handbrake-js'
import { strict as a } from 'assert'

const test = new Map()

test.set('--preset-list', async function () {
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

test.set('An incorrect HandbrakeCLIPath should fail but not be passed to the exec cmd', async function () {
  return new Promise((resolve, reject) => {
    hbjs.exec({ 'preset-list': true, HandbrakeCLIPath: 'one' }, function (err, stdout, stderr) {
      if (err) {
        a.equal(err.cmd, '"one" --preset-list')
        resolve()
      } else {
        reject(new Error("Shouldn't reach here"))
      }
    })
  })
})

export { test }
