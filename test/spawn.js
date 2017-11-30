const TestRunner = require('test-runner')
const hbjs = require('../lib/handbrake-js')
const Handbrake = require('../lib/Handbrake')
const mockCp = require('./mock/child_process')
const a = require('assert')

const runner = new TestRunner()
hbjs._usage.disable()

runner.test('spawn: correct return type', function () {
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  a.ok(handbrake instanceof Handbrake)
})
