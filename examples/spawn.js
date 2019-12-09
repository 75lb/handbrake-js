const hbjs = require('..')
const path = require('path')

const options = {
  input: path.resolve(__dirname, '../test/video/demo.mkv'),
  output: 'output.mp4',
  preset: 'Very Fast 480p30'
}

/*
Transcodes the input .mkv to an .mp4 using the 'Normal' preset.
Using spawn enables you to track progress while encoding,
more appropriate for long-running tasks.
*/
hbjs.spawn(options)
  .on('error', console.error)
  .on('output', process.stdout.write.bind(process.stdout))
