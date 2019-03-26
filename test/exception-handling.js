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
        a.strictEqual(err.errno, 'ENOENT')
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
          a.deepEqual(err, {
            name: 'ValidationError',
            message: 'input and output paths are the same',
            options: { input: 'blah', output: 'blah' },
            output: ''
          })
          resolve()
        } catch (err) {
          reject(err)
        }
      })
  })
})
