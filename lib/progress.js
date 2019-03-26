const short = {
  pattern: /\rEncoding: task (\d) of (\d), (.+) %/,
  parse: function (progressString) {
    const match = progressString.match(this.pattern)
    if (match) {
      const data = exports.last = {
        taskNumber: +match[1],
        taskCount: +match[2],
        percentComplete: +match[3],
        fps: 0,
        avgFps: 0,
        eta: '',
        task: 'Encoding'
      }
      return data
    }
  }
}

const long = {
  pattern: /\rEncoding: task (\d) of (\d), (.+) % \((.+) fps, avg (.+) fps, ETA (.+)\)/,
  parse: function (progressString) {
    const match = progressString.match(this.pattern)
    if (match) {
      const data = exports.last = {
        taskNumber: +match[1],
        taskCount: +match[2],
        percentComplete: +match[3],
        fps: +match[4],
        avgFps: +match[5],
        eta: match[6],
        task: 'Encoding'
      }
      return data
    }
  }
}

const muxing = {
  pattern: /\rMuxing: this may take awhile.../,
  parse: function (progressString) {
    const match = progressString.match(this.pattern)
    if (match) {
      const data = exports.last = {
        taskNumber: 0,
        taskCount: 0,
        percentComplete: 0,
        fps: 0,
        avgFps: 0,
        eta: '',
        task: 'Muxing'
      }
      return data
    }
  }
}

exports.short = short
exports.long = long
exports.muxing = muxing
