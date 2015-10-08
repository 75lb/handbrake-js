'use strict'
var test = require('tape')
var hbjs = require('../lib/handbrake-js')
var mockCp = require('./mock/child_process')

test('Handbrake, start event', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('start', function () {
    t.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 3.31 %')
  })
})

test('Handbrake, begin event', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('begin', function () {
    t.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 3.31 %')
  })
})

test('Handbrake, progress event: encoding (short)', function (t) {
  t.plan(2)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    t.deepEqual(progress, {
      taskNumber: 1,
      taskCount: 1,
      percentComplete: 1.23,
      fps: 0,
      avgFps: 0,
      eta: '',
      task: 'Encoding'
    })
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
  })
})

test('HandbrakeProcess, progress event: encoding (long)', function (t) {
  t.plan(2)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    t.deepEqual(progress, {
      taskNumber: 1,
      taskCount: 1,
      percentComplete: 45.46,
      fps: 105.33,
      avgFps: 106.58,
      eta: '00h00m05s',
      task: 'Encoding'
    })
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
  })
})

test('HandbrakeProcess, progress event: fragmented', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    t.deepEqual(progress, {
      taskNumber: 1,
      taskCount: 1,
      percentComplete: 45.46,
      fps: 105.33,
      avgFps: 106.58,
      eta: '00h00m05s',
      task: 'Encoding'
    })
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\r')
    mockCp.lastHandle.stdout.emit('data', 'Encoding: task 1 of 1')
    mockCp.lastHandle.stdout.emit('data', ', 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
  })
})

test('HandbrakeProcess, progress event: muxing', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    t.deepEqual(progress, {
      taskNumber: 0,
      taskCount: 0,
      percentComplete: 0,
      fps: 0,
      avgFps: 0,
      eta: '',
      task: 'Muxing'
    })
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rMuxing: this may take awhile...')
  })
})

test('HandbrakeProcess, end event (without encode)', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ help: true }, { cp: mockCp })
  handbrake.on('end', function () {
    t.fail()
  })

  process.nextTick(function () {
    mockCp.lastHandle.emit('exit', 0)
    t.pass()
  })
})

test('HandbrakeProcess, end event (with encode)', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ help: true }, { cp: mockCp })
  handbrake.on('end', function () {
    t.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.emit('exit', 0)
  })
})

test('HandbrakeProcess, complete event', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('complete', function () {
    t.pass()
  })

  process.nextTick(function () {
    mockCp.lastHandle.emit('exit', 0)
  })
})

test('HandbrakeProcess, output event (stdout)', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('output', function (output) {
    t.equal(output, 'clive, yeah?')
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', 'clive, yeah?')
  })
})

test('HandbrakeProcess, output event (stderr)', function (t) {
  t.plan(1)
  var handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('output', function (output) {
    t.equal(output, 'clive, yeah?', output)
  })

  process.nextTick(function () {
    mockCp.lastHandle.stderr.emit('data', 'clive, yeah?')
  })
})
