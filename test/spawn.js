'use strict'
var TestRunner = require('test-runner')
var hbjs = require('../lib/handbrake-js')
var Handbrake = require('../lib/Handbrake')
var mockCp = require('./mock/child_process')
var a = require('core-assert')

var runner = new TestRunner()
hbjs._usage.disable()

runner.test('spawn: correct return type', function () {
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  a.ok(handbrake instanceof Handbrake)
})
