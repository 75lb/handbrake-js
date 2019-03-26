const EventEmitter = require('events').EventEmitter
const Readable = require('stream').Readable

exports.spawn = spawn
exports.lastHandle = null

class MockChildProcess extends EventEmitter {
  constructor () {
    super()
    this.stdout = new Readable()
    this.stdout._read = function () {}
    this.stderr = new Readable()
    this.stderr._read = function () {}
  }
}

function spawn () {
  exports.lastHandle = new MockChildProcess()
  return exports.lastHandle
}
