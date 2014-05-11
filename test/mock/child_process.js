"use strict";
var util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Readable = require("stream").Readable;

exports.spawn = spawn;

function MockChildProcess(){
    this.stdout = new Readable();
    this.stdout._read = function(){};
    this.stderr = new Readable();
    this.stderr._read = function(){};
}
util.inherits(MockChildProcess, EventEmitter);

function spawn(){
    exports.lastHandle = new MockChildProcess();
    return exports.lastHandle;
}
