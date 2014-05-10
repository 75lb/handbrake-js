"use strict";
var util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Readable = require("stream").Readable;

exports.spawn = spawn;

function MockChildProcess(){
    this.stdout = new Readable();
    this.stderr = new Readable();
}
util.inherits(MockChildProcess, EventEmitter);

function spawn(){
    return new MockChildProcess();
}
