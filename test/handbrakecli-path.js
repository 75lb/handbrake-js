import TestRunner from 'test-runner'
import hbjs from 'handbrake-js'
import { strict as a } from 'assert'
import path from 'path'
import fs from 'fs'

const tom = new TestRunner.Tom()

if (process.platform === 'darwin') {
  tom.before('Copy HandbrakeCLI to a different location', async function() {
    try {
      fs.mkdirSync('./tmp')
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err
      }
    }
    fs.cpSync('./bin/HandbrakeCLI', './tmp/HandbrakeCLI')
  })

  tom.test('hbjs:run() - Use custom HandbrakeCLI path', async function () {
    const options = {
      input: './test/video/demo.mkv',
      output: './tmp/output.mp4',
      preset: 'Very Fast 480p30',
      HandbrakeCLIPath: './tmp/HandbrakeCLI'
    }

    const result = await hbjs.run(options)
    a.ok(/Encode done!/.test(result.stderr))
  })
}


export default tom
