'use strict'
var test = require('tape')
var handbrakeJs = require('../lib/handbrake-js')
var Handbrake = require('../lib/Handbrake')
var mockCp = require('./mock/child_process')

test('spawn: correct return type', function (t) {
  t.plan(1)
  var handbrake = handbrakeJs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  t.ok(handbrake instanceof Handbrake)
})
