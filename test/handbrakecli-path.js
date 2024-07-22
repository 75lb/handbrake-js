import hbjs from 'handbrake-js'
import { strict as a } from 'assert'
import path from 'path'
import fs from 'fs'

const test = new Map()

if (process.platform === 'darwin') {
  test.set('Copy HandbrakeCLI to a different location', async function() {
    try {
      fs.mkdirSync('./tmp')
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err
      }
    }
    fs.cpSync('./bin/HandbrakeCLI', './tmp/HandbrakeCLI')
  })

  test.set('hbjs:run() - Use custom HandbrakeCLI path', async function () {
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


export { test }
