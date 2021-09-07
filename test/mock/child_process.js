import { EventEmitter } from 'events'
import { Readable } from 'stream'

let lastHandle = null

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
  lastHandle = new MockChildProcess()
  return lastHandle
}

export { spawn, lastHandle }
