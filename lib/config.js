const path = require('path')

/* path to the HandbrakeCLI executable downloaded by the install script */
let HandbrakeCLIPath = null

switch (process.platform) {
  case 'darwin':
    HandbrakeCLIPath = path.join(__dirname, '..', 'bin', 'HandbrakeCLI')
    break
  case 'win32':
    HandbrakeCLIPath = path.join(__dirname, '..', 'bin', 'HandbrakeCLI.exe')
    break
  case 'linux':
    HandbrakeCLIPath = 'HandBrakeCLI'
    break
}

exports.HandbrakeCLIPath = HandbrakeCLIPath
