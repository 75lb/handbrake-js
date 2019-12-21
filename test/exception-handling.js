const Tom = require('test-runner').Tom
const hbjs = require('../')
const mockCp = require('./mock/child_process')
const a = require('assert').strict

const tom = module.exports = new Tom({ maxConcurrency: 1 })

tom.test('validation: HandbrakeCLI not found', function () {
  return new Promise(function (resolve, reject) {
    const handbrake = hbjs.spawn(
      { input: 'in', output: 'out' },
      { HandbrakeCLIPath: 'broken/path' }
    )
    handbrake.on('error', function (err) {
      try {
        a.equal(err.name, 'HandbrakeCLINotFound')
        a.ok(/HandbrakeCLI application not found/.test(err.message))
        a.equal(err.HandbrakeCLIPath, 'broken/path')
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
          a.equal(err.name, 'ValidationError')
          a.equal(err.message, 'input and output paths are the same')
          a.equal(err.output, '')
          a.deepEqual(err.options, { input: 'blah', output: 'blah' })
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
        a.equal(err.name, 'InvalidPreset')
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
        a.equal(err.name, 'InvalidInput')
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
})
