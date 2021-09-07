#!/usr/bin/env node
import ansi from 'ansi-escape-sequences'
import commandLineArgs from 'command-line-args'
import * as hbjs from 'handbrake-js'
import cliOptions from '../lib/cli-options.js'
import util from 'util'

const handbrakeOptions = commandLineArgs(cliOptions)._all

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
  const handbrake = hbjs.spawn(handbrakeOptions)
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
