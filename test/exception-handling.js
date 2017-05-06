'use strict'
var TestRunner = require('test-runner')
var hbjs = require('../lib/handbrake-js')
var mockCp = require('./mock/child_process')
var a = require('core-assert')

var runner = new TestRunner({ sequential: true })
hbjs._usage.disable()

runner.test('exception handling: HandbrakeCLI not found', function () {
  return new Promise(function (resolve, reject) {
    var handbrake = hbjs.spawn(
      { input: 'in', output: 'out' },
      { HandbrakeCLIPath: 'broken/path' }
    )
    handbrake.on('error', function (err) {
      a.equal(err.name, 'HandbrakeCLINotFound')
      a.ok(/HandbrakeCLI application not found/.test(err.message))
      a.equal(err.HandbrakeCLIPath, 'broken/path')
      a.equal(err.errno, 'ENOENT')
      a.ok(/ENOENT/.test(err.spawnmessage))
      a.deepEqual(err.options, { input: 'in', output: 'out' })
      resolve()
    })
  })
})

runner.test('validation: input === output', function () {
  return new Promise(function (resolve, reject) {
    hbjs.spawn({ input: 'blah', output: 'blah' }, { cp: mockCp })
      .on('error', function (err) {
        a.deepEqual(err, {
          name: 'ValidationError',
          message: 'input and output paths are the same',
          options: { input: 'blah', output: 'blah' },
          output: ''
        })
        resolve()
      })
  })
})
