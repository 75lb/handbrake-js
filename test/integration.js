'use strict'
var TestRunner = require('test-runner')
var cp = require('child_process')
var fs = require('fs')
var hbjs = require('../lib/handbrake-js')
var a = require('core-assert')
var Counter = require('./lib/counter')

var runner = new TestRunner()

runner.test('cli: --preset-list', function () {
  var counter = Counter.create(1)
  cp.exec('node bin/cli.js --preset-list', function (err, stdout, stderr) {
    if (err) {
      counter.fail(stderr)
    } else {
      counter.pass()
    }
  })
  return counter.promise
})

runner.test('cli: simple encode', function () {
  var counter = Counter.create(1)
  try {
    fs.mkdirSync('tmp')
  } catch (err) {
    // dir already exists
  }
  cp.exec('node bin/cli.js -i test/video/demo.mkv -o tmp/test.mp4 --rotate 5 -v', function (err, stdout, stderr) {
    if (err) {
      counter.fail(stderr)
    } else {
      a.ok(/Rotate \(rotate & flip image axes\) \(5\)/.test(stdout))
      counter.pass()
    }
  })
  return counter.promise
})

runner.test('exec: --preset-list', function () {
  var counter = Counter.create(1)
  hbjs.exec({ 'preset-list': true }, function (err, stdout, stderr) {
    if (err) {
      counter.fail(stderr)
    } else if (/Devices/.test(stdout)) {
      counter.pass()
    }
  })
  return counter.promise
})

runner.test('.cancel()', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ input: 'test/video/demo.mkv', output: 'tmp/cancelled.mp4' })
  handbrake.on('begin', function () {
    handbrake.cancel()
  })
  handbrake.on('cancelled', function () {
    counter.pass()
  })
  return counter.promise
})
