import hbjs from 'handbrake-js'
import path from 'path'
import currentModulePaths from 'current-module-paths'
const { __dirname } = currentModulePaths(import.meta.url)

async function start () {
  const options = {
    input: path.resolve(__dirname, '../test/video/demo.mkv'),
    output: './tmp/output.mp4',
    preset: 'Very Fast 480p30',
    HandbrakeCLIPath: './tmp/HandbrakeCLI'
  }

  const result = await hbjs.run(options)
  console.log(result)
}

start().catch(console.error)
