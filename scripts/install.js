#!/usr/bin/env node
import fetch from 'node-fetch'
import decompress from 'decompress'
import { exec } from 'child_process'
import util from 'util'
import fs from 'fs'
import path from 'path'
import { rimrafSync } from 'rimraf'
import currentModulePaths from 'current-module-paths'
const { __dirname } = currentModulePaths(import.meta.url)

const version = '1.6.1'
const downloadPath = 'https://github.com/HandBrake/HandBrake/releases/download/%s/HandBrakeCLI-%s%s'

function downloadFile (from, to, done) {
  console.log('fetching: ' + from)
  fetch(from, { redirect: 'follow' }).then(response => {
    if (response.ok) {
      console.log(`Downloading HandbrakeCLI (${Number(response.headers.get('content-length')).toLocaleString()} bytes) `)
      response.buffer().then(buf => fs.writeFile(to, buf, done))
    } else {
      throw new Error(`Failed to download Handbrake: ${response.status} ${response.statusText}`)
    }
  })
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
          rimrafSync('unzipped')
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

if (process.platform === 'darwin') {
  go({
    url: util.format(downloadPath, version, version, '.dmg'),
    archive: 'mac.dmg',
    copyFrom: 'HandbrakeCLI',
    copyTo: path.join('bin', 'HandbrakeCLI')
  })
} else if (process.platform === 'win32') {
  const win32 = {
    url: util.format(downloadPath, version, version, '-win-x86_64.zip'),
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
  go(process.arch === 'x64' ? win64 : win32)
} else if (process.platform === 'linux') {
  console.log(`Linux users
============
handbrake-cli must be installed separately as the root user.
Ubuntu users can do this using the following commands:

add-apt-repository --yes ppa:stebbins/handbrake-releases
apt-get update -qq
apt-get install -qq handbrake-cli

For all issues regarding installation of HandbrakeCLI on Linux, consult the Handbrake website:
http://handbrake.fr`)
}
