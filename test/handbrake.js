'use strict'
var TestRunner = require('test-runner')
var hbjs = require('../lib/handbrake-js')
var mockCp = require('./mock/child_process')
var a = require('core-assert')
var Counter = require('./lib/counter')

var runner = new TestRunner({ sequential: false })

runner.test('Handbrake, start event', function () {
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  var counter = Counter.create(1)

  handbrake.on('start', function () {
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 3.31 %')
  })

  return counter.promise
})

runner.test('Handbrake, begin event', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('begin', function () {
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 3.31 %')
  })

  return counter.promise
})

runner.test('Handbrake, progress event: encoding (short)', function () {
  var counter = Counter.create(2)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    a.deepEqual(progress, {
      taskNumber: 1,
      taskCount: 1,
      percentComplete: 1.23,
      fps: 0,
      avgFps: 0,
      eta: '',
      task: 'Encoding'
    })
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
  })

  return counter.promise
})

runner.test('HandbrakeProcess, progress event: encoding (long)', function () {
  var counter = Counter.create(2)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    a.deepEqual(progress, {
      taskNumber: 1,
      taskCount: 1,
      percentComplete: 45.46,
      fps: 105.33,
      avgFps: 106.58,
      eta: '00h00m05s',
      task: 'Encoding'
    })
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
  })

  return counter.promise
})

runner.test('HandbrakeProcess, progress event: fragmented', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    a.deepEqual(progress, {
      taskNumber: 1,
      taskCount: 1,
      percentComplete: 45.46,
      fps: 105.33,
      avgFps: 106.58,
      eta: '00h00m05s',
      task: 'Encoding'
    })
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\r')
    mockCp.lastHandle.stdout.emit('data', 'Encoding: task 1 of 1')
    mockCp.lastHandle.stdout.emit('data', ', 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
  })

  return counter.promise
})

runner.test('HandbrakeProcess, progress event: muxing', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    a.deepEqual(progress, {
      taskNumber: 0,
      taskCount: 0,
      percentComplete: 0,
      fps: 0,
      avgFps: 0,
      eta: '',
      task: 'Muxing'
    })
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rMuxing: this may take awhile...')
  })

  return counter.promise
})

runner.test('HandbrakeProcess, end event (without encode)', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ help: true }, { cp: mockCp })
  handbrake.on('end', function () {
    counter.fail('"end" should not be fired')
  })

  process.nextTick(function () {
    mockCp.lastHandle.emit('exit', 0)
    counter.pass()
  })

  return counter.promise
})

runner.test('HandbrakeProcess, end event (with encode)', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ help: true }, { cp: mockCp })
  handbrake.on('end', function () {
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.emit('exit', 0)
  })

  return counter.promise
})

runner.test('HandbrakeProcess, complete event', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('complete', function () {
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.emit('exit', 0)
  })

  return counter.promise
})

runner.test('HandbrakeProcess, output event (stdout)', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('output', function (output) {
    a.strictEqual(output, 'clive, yeah?')
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', 'clive, yeah?')
  })

  return counter.promise
})

runner.test('HandbrakeProcess, output event (stderr)', function () {
  var counter = Counter.create(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('output', function (output) {
    a.strictEqual(output, 'clive, yeah?', output)
    counter.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stderr.emit('data', 'clive, yeah?')
  })

  return counter.promise
})
