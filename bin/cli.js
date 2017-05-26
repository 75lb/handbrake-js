#!/usr/bin/env node
'use strict'
var ansi = require('ansi-escape-sequences')
var commandLineArgs = require('command-line-args')
var hbjs = require('../lib/handbrake-js')
hbjs._usage.defaults.set('cd4', 'cli')
var cliOptions = require('../lib/cli-options')
var util = require('util')

var handbrakeOptions = {}
try {
  handbrakeOptions = commandLineArgs(cliOptions)._all
} catch (err) {
  hbjs._usage.exception({ exd: err.toString() })
  hbjs._usage.send({ timeout: 3000 })
    .catch(function () { /* disregard errors */ })
  halt(err)
  return
}

function column (n, msg) {
  process.stdout.write(ansi.cursor.horizontalAbsolute(n) + msg)
}

function onProgress (progress) {
  column(1, progress.task + '  ')
  column(11, progress.percentComplete.toFixed(2) + '   ')
  column(22, progress.fps.toFixed(2) + '   ')
  column(32, progress.avgFps.toFixed(2) + '   ')
  column(42, progress.eta)
}

function halt (err) {
  console.error(ansi.format(util.inspect(err), 'red'))
  process.exitCode = 1
}

/* user intends to encode, so attach progress reporter (unless --verbose was passed) */
if (handbrakeOptions.input && handbrakeOptions.output) {
  var handbrake = hbjs.spawn(handbrakeOptions)
    .on('error', halt)
    .on('complete', console.log.bind(console))

  if (handbrakeOptions.verbose) {
    handbrake.on('output', process.stdout.write.bind(process.stdout))
  } else {
    handbrake
      .on('begin', function () {
        console.log(ansi.format('Task      % done     FPS       Avg FPS   ETA', 'bold'))
        this.began = true
      })
      .on('progress', onProgress)
      .on('complete', function () {
        if (!this.began) console.error(this.output)
      })
  }
} else {
  hbjs.spawn(handbrakeOptions)
    .on('error', halt)
    .on('output', process.stdout.write.bind(process.stdout))
}
