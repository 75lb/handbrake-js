const hbjs = require('..')
const path = require('path')

async function start () {
  const options = {
    input: path.resolve(__dirname, '../test/video/demo.mkv'),
    output: 'output.mp4',
    preset: 'Very Fast 480p30'
  }

  const result = await hbjs.run(options)
  console.log(result)
}

start().catch(console.error)
