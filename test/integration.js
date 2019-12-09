const Tom = require('test-runner').Tom
const cp = require('child_process')
const fs = require('fs')
const hbjs = require('../')
const a = require('assert')
const sleep = require('sleep-anywhere')

const tom = module.exports = new Tom()

tom.test('cli: --preset-list', async function () {
  const events = []
  cp.exec('node bin/cli.js --preset-list', function (err, stdout, stderr) {
    if (err) {
      events.push('fail')
    } else {
      events.push(stdout)
    }
  })
  await sleep(1000)
  a.strictEqual(events.length, 1)
  a.ok(/Legacy/.test(events[0]))
})

tom.test('cli: simple encode', async function () {
  try {
    fs.mkdirSync('tmp')
  } catch (err) {
    // dir already exists
  }
  return new Promise((resolve, reject) => {
    cp.exec('node bin/cli.js -i test/video/demo.mkv -o tmp/test.mp4 --rotate angle=90:hflip=1 -v', (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        /* Handbrake v1.3.0 || Handbrake v1.1.2 (installed on travis) */
        if (/Rotate \(angle=90:hflip=1\)/.test(stdout) || /dir=clock_flip/.test(stdout)) {
          resolve()
        } else {
          reject(new Error('Incorrect stdout'))
        }
      }
    })
  })
})

tom.test('exec: --preset-list', async function () {
  const events = []
  hbjs.exec({ 'preset-list': true }, function (err, stdout, stderr) {
    if (err) {
      events.push('fail')
    } else if (/Devices/.test(stderr)) {
      events.push('pass')
    }
  })
  await sleep(1000)
  a.deepStrictEqual(events, ['pass'])
})

tom.test('run: --version', async function () {
  const events = []
  const result = await hbjs.run({ version: true })
  this.data = result
})

tom.test('.cancel()', async function () {
  const events = []
  const handbrake = hbjs.spawn({ input: 'test/video/demo.mkv', output: 'tmp/cancelled.mp4' })
  handbrake.on('begin', function () {
    handbrake.cancel()
  })
  handbrake.on('cancelled', function () {
    events.push('pass')
  })
  await sleep(2000)
  a.deepStrictEqual(events, ['pass'])
})

tom.test('spawn: correct return type', async function () {
  const mockCp = require('./mock/child_process')
  const Handbrake = require('../lib/Handbrake')
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  a.ok(handbrake instanceof Handbrake)
})
