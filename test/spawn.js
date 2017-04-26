'use strict'
var TestRunner = require('test-runner')
var handbrakeJs = require('../lib/handbrake-js')
var Handbrake = require('../lib/Handbrake')
var mockCp = require('./mock/child_process')
var a = require('core-assert')

var runner = new TestRunner()

runner.test('spawn: correct return type', function () {
  var handbrake = handbrakeJs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  a.ok(handbrake instanceof Handbrake)
})
