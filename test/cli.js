import TestRunner from 'test-runner'
import { strict as a } from 'assert'
import path from 'path'
import cp from 'child_process'
import fs from 'fs'
import currentModulePaths from 'current-module-paths'
const { __dirname } = currentModulePaths(import.meta.url)

const tom = new TestRunner.Tom()

const cliPath = path.resolve(__dirname, '../bin/cli.js')

tom.test('--preset-list', async function () {
  return new Promise((resolve, reject) => {
    cp.exec(`node ${cliPath} --preset-list`, function (err, stdout, stderr) {
      if (err) {
        reject(err)
      } else {
        a.ok(/General/.test(stdout))
        resolve()
      }
    })
  })
})

tom.test('simple encode', async function () {
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

export default tom
