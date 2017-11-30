const hbjs = require('..')
const path = require('path')

const options = {
  input: path.resolve(__dirname, '../test/video/demo.mkv'),
  output: 'output.mp4'
}

/*
Transcodes the input .mkv to an .mp4 using the default encoding options.
Callback is fired once after the encode completes.
*/
hbjs.exec(options, function (err, stdout, stderr) {
  if (err) throw err
  console.log('STDERR:', stderr)
  console.log('STDOUT:', stdout)
})
