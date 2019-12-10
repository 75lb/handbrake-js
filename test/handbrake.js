const Tom = require('test-runner').Tom
const hbjs = require('../')
const mockCp = require('./mock/child_process')
const a = require('assert').strict
const sleep = require('sleep-anywhere')

const tom = module.exports = new Tom()

tom.test('start event fires once only', async function () {
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  const actuals = []

  handbrake.on('start', function () {
    actuals.push('start')
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 3.31 %')
  })

  await sleep(100)
  a.deepEqual(actuals, ['start'])
})

tom.test('begin event', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('begin', function () {
    actuals.push('begin')
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 3.31 %')
  })

  await sleep(100)
  a.deepEqual(actuals, ['begin'])
})

tom.test('progress event: encoding (short)', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    actuals.push(progress)
  })
  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 3.49 %')
  })
  await sleep(100)
  a.equal(actuals.length, 2)
  a.deepEqual(actuals[0], {
    taskNumber: 1,
    taskCount: 1,
    percentComplete: 1.23,
    fps: 0,
    avgFps: 0,
    eta: '',
    task: 'Encoding'
  })
  a.deepEqual(actuals[1], {
    taskNumber: 1,
    taskCount: 1,
    percentComplete: 3.49,
    fps: 0,
    avgFps: 0,
    eta: '',
    task: 'Encoding'
  })
})

tom.test('progress event: encoding (long)', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    actuals.push(progress)
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 55.46 % (205.33 fps, avg 106.58 fps, ETA 00h00m05s)')
  })

  await sleep(100)
  a.equal(actuals.length, 2)
  a.deepEqual(actuals[0], {
    taskNumber: 1,
    taskCount: 1,
    percentComplete: 45.46,
    fps: 105.33,
    avgFps: 106.58,
    eta: '00h00m05s',
    task: 'Encoding'
  })
  a.deepEqual(actuals[1], {
    taskNumber: 1,
    taskCount: 1,
    percentComplete: 55.46,
    fps: 205.33,
    avgFps: 106.58,
    eta: '00h00m05s',
    task: 'Encoding'
  })
})

tom.test('progress event: fragmented', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    actuals.push(progress)
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\r')
    mockCp.lastHandle.stdout.emit('data', 'Encoding: task 1 of 1')
    mockCp.lastHandle.stdout.emit('data', ', 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)')
  })

  await sleep(100)
  a.deepEqual(actuals, [
    {
      taskNumber: 1,
      taskCount: 1,
      percentComplete: 45.46,
      fps: 105.33,
      avgFps: 106.58,
      eta: '00h00m05s',
      task: 'Encoding'
    }
  ])
})

tom.test('progress event: muxing', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('progress', function (progress) {
    actuals.push(progress)
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rMuxing: this may take awhile...')
  })

  await sleep(100)
  a.deepEqual(actuals, [
    {
      taskNumber: 0,
      taskCount: 0,
      percentComplete: 0,
      fps: 0,
      avgFps: 0,
      eta: '',
      task: 'Muxing'
    }
  ])
})

tom.test('end event (without encode)', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ help: true }, { cp: mockCp })
  handbrake.on('end', function () {
    actuals.push('end should not be fired')
  })

  process.nextTick(function () {
    mockCp.lastHandle.emit('exit', 0)
    actuals.push('exit')
  })

  await sleep(100)
  a.deepEqual(actuals, ['exit'])
})

tom.test('end event (with encode)', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ help: true }, { cp: mockCp })
  handbrake.on('end', function () {
    actuals.push('end')
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', '\rEncoding: task 1 of 1, 1.23 %')
    mockCp.lastHandle.emit('exit', 0)
  })

  await sleep(100)
  a.deepEqual(actuals, ['end'])
})

tom.test('complete event', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('complete', function () {
    actuals.push('complete')
  })

  process.nextTick(function () {
    mockCp.lastHandle.emit('exit', 0)
  })

  await sleep(100)
  a.deepEqual(actuals, ['complete'])
})

tom.test('output event (stdout)', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('output', function (output) {
    actuals.push(output)
  })

  process.nextTick(function () {
    mockCp.lastHandle.stdout.emit('data', 'clive, yeah?')
  })

  await sleep(100)
  a.deepEqual(actuals, ['clive, yeah?'])
})

tom.test('output event (stderr)', async function () {
  const actuals = []
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  handbrake.on('output', function (output) {
    actuals.push(output)
  })

  process.nextTick(function () {
    mockCp.lastHandle.stderr.emit('data', 'clive, yeah?')
  })

  await sleep(100)
  a.deepEqual(actuals, ['clive, yeah?'])
})
