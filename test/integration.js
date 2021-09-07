import TestRunner from 'test-runner'
import * as hbjs from 'handbrake-js'
import * as mockCp from './mock/child_process.js'
import { strict as a } from 'assert'
import sleep from 'sleep-anywhere'
import path from 'path'
import cp from 'child_process'
import fs from 'fs'
import Handbrake from '../lib/Handbrake.js'
import currentModulePaths from 'current-module-paths'
const { __dirname } = currentModulePaths(import.meta.url)

const tom = new TestRunner.Tom()

const cliPath = path.resolve(__dirname, '../bin/cli.js')

tom.test('cli: --preset-list', async function () {
  return new Promise((resolve, reject) => {
    cp.exec(`node ${cliPath} --preset-list`, function (err, stdout, stderr) {
      if (err) {
        reject(err)
      } else {
        a.ok(/Legacy/.test(stdout))
        resolve()
      }
    })
  })
})

tom.test('cli: simple encode', async function () {
  try {
    fs.mkdirSync('tmp')
  } catch (err) {
    // dir already exists
  }
  return new Promise((resolve, reject) => {
    const inputPath = path.resolve(__dirname, 'video/demo.mkv')
    const outputPath = path.resolve(__dirname, '../tmp/test.mp4')
    cp.exec(`node ${cliPath} -i ${inputPath} -o ${outputPath} --rotate angle=90:hflip=1 -v`, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        /* Handbrake v1.3.0 || Handbrake v1.1.2 (installed on travis) */
        if (/Rotate \(angle=90:hflip=1\)/.test(stdout) || /dir=clock_flip/.test(stdout)) {
          resolve()
        } else {
          reject(new Error('Incorrect stdout'))
        }
      }
    })
  })
})

tom.test('exec: --preset-list', async function () {
  return new Promise((resolve, reject) => {
    hbjs.exec({ 'preset-list': true }, function (err, stdout, stderr) {
      if (err) {
        reject(err)
      } else {
        a.ok(/Devices/.test(stderr))
        resolve()
      }
    })
  })
})

tom.test('run: --version', async function () {
  const events = []
  const result = await hbjs.run({ version: true })
  this.data = result
})

tom.test('.cancel(): must fire cancelled event within 5s', async function () {
  return new Promise((resolve, reject) => {
    const events = []
    const handbrake = hbjs.spawn({
      input: path.resolve(__dirname, 'video/demo.mkv'),
      output: path.resolve(__dirname, '../tmp/cancelled.mp4' )
    })
    handbrake.on('begin', function () {
      handbrake.cancel()
    })
    handbrake.on('cancelled', function () {
      resolve()
    })
  })
}, { timeout: 5000 })

tom.test('spawn: correct return type', async function () {
  const handbrake = hbjs.spawn({ input: 'in', output: 'out' }, { cp: mockCp })
  a.ok(handbrake instanceof Handbrake)
})

export default tom
