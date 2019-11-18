const Tom = require('test-runner').Tom
const hbjs = require('../')
const mockCp = require('./mock/child_process')
const a = require('assert')

const tom = module.exports = new Tom('exceptions', { concurrency: 1 })

tom.test('validation: HandbrakeCLI not found', function () {
  return new Promise(function (resolve, reject) {
    const handbrake = hbjs.spawn(
      { input: 'in', output: 'out' },
      { HandbrakeCLIPath: 'broken/path' }
    )
    handbrake.on('error', function (err) {
      try {
        a.strictEqual(err.name, 'HandbrakeCLINotFound')
        a.ok(/HandbrakeCLI application not found/.test(err.message))
        a.strictEqual(err.HandbrakeCLIPath, 'broken/path')
        a.ok(err.errno === 'ENOENT' || err.errno === -2)
        a.ok(/ENOENT/.test(err.spawnmessage))
        a.deepEqual(err.options, { input: 'in', output: 'out' })
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
})

tom.test('validation: input === output', function () {
  return new Promise(function (resolve, reject) {
    hbjs.spawn({ input: 'blah', output: 'blah' }, { cp: mockCp })
      .on('error', function (err) {
        try {
          a.strictEqual(err.name, 'ValidationError')
          a.strictEqual(err.message, 'input and output paths are the same')
          a.strictEqual(err.output, '')
          a.deepStrictEqual(err.options, { input: 'blah', output: 'blah' })
          resolve()
        } catch (err) {
          reject(err)
        }
      })
  })
})

tom.test('invalid preset name', function () {
  return new Promise(function (resolve, reject) {
    const options = {
      input: 'test/video/demo.mkv',
      output: 'tmp/cancelled.mp4',
      preset: 'broken'
    }
    hbjs.spawn(options).on('error', function (err) {
      try {
        a.strictEqual(err.name, 'InvalidPreset')
        a.ok(/invalid preset/i.test(err.message))
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
})

tom.test('invalid input file', function () {
  return new Promise(function (resolve, reject) {
    const options = {
      input: 'broken',
      output: 'tmp/cancelled.mp4'
    }
    hbjs.spawn(options).on('error', function (err) {
      try {
        a.strictEqual(err.name, 'InvalidInput')
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
})
