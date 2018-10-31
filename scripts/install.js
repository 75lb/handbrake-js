#!/usr/bin/env node
const request = require('request')
const decompress = require('decompress')
const exec = require('child_process').exec
const util = require('util')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const nodeVersionMatches = require('node-version-matches')

// Fix for node ^8.6.0, ^9.0.0: https://github.com/nodejs/node/issues/16196
if (nodeVersionMatches('>=8.6.0 <10.0.0')) {
  require('tls').DEFAULT_ECDH_CURVE = 'auto';
}

const version = '1.1.2'
const downloadPath = 'http://download.handbrake.fr/releases/%s/HandBrakeCLI-%s%s'

const win32 = {
  url: util.format(downloadPath, version, version, '-win-i686.zip'),
  archive: 'win.zip',
  copyFrom: path.join('unzipped', 'HandBrakeCLI.exe'),
  copyTo: path.join('bin', 'HandbrakeCLI.exe')
}

const win64 = {
  url: util.format(downloadPath, version, version, '-win-x86_64.zip'),
  archive: 'win.zip',
  copyFrom: path.join('unzipped', 'HandBrakeCLI.exe'),
  copyTo: path.join('bin', 'HandbrakeCLI.exe')
}

const mac = {
  url: util.format(downloadPath, version, version, '.dmg'),
  archive: 'mac.dmg',
  copyFrom: 'HandbrakeCLI',
  copyTo: path.join('bin', 'HandbrakeCLI')
}

function downloadFile (from, to, done) {
  console.log('fetching: ' + from)
  request(from).pipe(fs.createWriteStream(to)).on('close', done)
}

function extractFile (archive, copyFrom, copyTo, done) {
  console.log('extracting: ' + copyFrom)
  if (archive.indexOf('.zip') > 0) {
    if (!fs.existsSync('unzipped')) fs.mkdirSync('unzipped')
    decompress(archive, 'unzipped')
      .then(() => {
        const source = fs.createReadStream(copyFrom)
        const dest = fs.createWriteStream(copyTo)
        dest.on('close', function () {
          rimraf.sync('unzipped')
          done()
        })
        source.pipe(dest)
      })
  } else if (archive.indexOf('.dmg') > 0) {
    const cmd = 'hdiutil attach ' + archive
    exec(cmd, function (err, stdout) {
      if (err) throw err
      const match = stdout.match(/^(\/dev\/\w+)\b.*(\/Volumes\/.*)$/m)
      if (match) {
        const devicePath = match[1]
        const mountPath = match[2]
        copyFrom = path.join(mountPath, copyFrom)
        const source = fs.createReadStream(copyFrom)
        const dest = fs.createWriteStream(copyTo, { mode: parseInt(755, 8) })
        dest.on('close', function () {
          exec('hdiutil detach ' + devicePath, function (err) {
            if (err) throw err
            done()
          })
        })
        source.pipe(dest)
      }
    })
  }
}

function install (installation) {
  downloadFile(installation.url, installation.archive, function () {
    if (!fs.existsSync('bin')) fs.mkdirSync('bin')
    extractFile(installation.archive, installation.copyFrom, installation.copyTo, function () {
      console.log('HandbrakeCLI installation complete')
      fs.unlinkSync(installation.archive)
    })
  })
}

function go (installation) {
  if (fs.existsSync(path.resolve(__dirname, '..', installation.copyTo))) {
    exec(installation.copyTo + ' --version', function (err, stdout, stderr) {
      if (err) throw err
      if (stdout.match(version)) {
        console.log('You already have the latest HandbrakeCLI installed')
      } else {
        install(installation)
      }
    })
  } else {
    install(installation)
  }
}

const linuxMsg =
'Linux users\n\
============\n\
handbrake-cli must be installed separately as the root user.\n\
Ubuntu users can do this using the following commands:\n\
\n\
add-apt-repository --yes ppa:stebbins/handbrake-releases\n\
apt-get update -qq\n\
apt-get install -qq handbrake-cli\n\
\n\
For all issues regarding installation of HandbrakeCLI on Linux, consult the Handbrake website:\n\
http://handbrake.fr'

switch (process.platform) {
  case 'darwin':
    go(mac)
    break
  case 'win32':
    go(process.arch === 'x64' ? win64 : win32)
    break
  case 'linux':
    console.log(linuxMsg)
    break
}
