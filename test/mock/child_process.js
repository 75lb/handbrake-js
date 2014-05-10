"use strict";
var util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Readable = require("stream").Readable;

function MockChildProcess(){
    this.stdout = new Readable();
    this.stdout._read = function(){};
    this.stderr = new Readable();
    this.stderr._read = function(){};
}
util.inherits(MockChildProcess, EventEmitter);

function spawn(){
    return mockChildProcess;
}

var mockChildProcess = new MockChildProcess();

exports.spawn = spawn;
exports.mockChildProcess = mockChildProcess;
