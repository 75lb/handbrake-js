'use strict'
var test = require('tape')
var handbrakeJs = require('../lib/handbrake-js')
var mockCp = require('./mock/child_process')

test('exception handling: HandbrakeCLI not found', function (t) {
  t.plan(6)

  var handbrake = handbrakeJs.spawn(
    { input: 'in', output: 'out' },
    { HandbrakeCLIPath: 'broken/path' }
  )
  handbrake.on('error', function (err) {
    t.equal(err.name, 'HandbrakeCLINotFound')
    t.ok(/HandbrakeCLI application not found/.test(err.message))
    t.equal(err.HandbrakeCLIPath, 'broken/path')
    t.equal(err.errno, 'ENOENT')
    t.ok(/ENOENT/.test(err.spawnmessage))
    t.deepEqual(err.options, { input: 'in', output: 'out' })
  })
})

test('validation: input === output', function (t) {
  t.plan(1)

  handbrakeJs.spawn({ input: 'blah', output: 'blah' }, { cp: mockCp })
    .on('error', function (err) {
      t.deepEqual(err, {
        name: 'ValidationError',
        message: 'input and output paths are the same',
        options: { input: 'blah', output: 'blah' },
        output: ''
      })
    })
})
