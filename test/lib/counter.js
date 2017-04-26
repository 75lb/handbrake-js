'use strict'

/**
 * Currently incompatible with sequential runner
 */
function Counter (total) {
  this.count = 0
  this.total = total
  var that = this
  this.promise = new Promise(function (resolve, reject) {
    that.resolve = resolve
    that.reject = reject
  })
  if (!Counter._exitHandlerAdded) {
    process.on('exit', function () {
      Counter.done()
    })
    Counter._exitHandlerAdded = true
  }
}

Counter.prototype.pass = function () {
  this.count++
}

Counter.prototype.fail = function (msg) {
  this.count++
  this.reject(msg)
}

Counter.prototype.done = function () {
  if (this.count === this.total) {
    this.resolve()
  } else {
    this.reject(this.count > this.total ? 'Count too high' : 'Count too low')
  }
}

Counter.create = function (total) {
  var counter = new this(total)
  this.counters = this.counters || []
  this.counters.push(counter)
  return counter
}

Counter.done = function () {
  this.counters.forEach(function (counter) {
    counter.done()
  })
}

module.exports = Counter
