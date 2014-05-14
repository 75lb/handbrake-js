"use strict";
var path = require("path"),
    util = require("util"),
    cp = require("child_process"),
    EventEmitter = require("events").EventEmitter,
    HandbrakeOptions = require("./HandbrakeOptions"),
    progress = require("./progress");

module.exports = Handbrake;

var origCp = cp;

/**
@class
@classdesc A thin wrapper on the handbrakeCLI child_process handle
@extends EventEmitter
*/
function Handbrake(mocks){
    /** all handbrakeCLI output */
    this.allOutput = "";
    /** true when encoding  */
    this.inProgress = false;
    /** the options to encode with */
    this.options = new HandbrakeOptions();
    
    /* path to the HandbrakeCLI executable downloaded by the install script */
    this.HandbrakeCLIPath = null;
    
    switch (process.platform){
    case "darwin":
        this.HandbrakeCLIPath = path.join(__dirname, "..", "bin", "HandbrakeCLI");
        break;
    case "win32":
        this.HandbrakeCLIPath = path.join(__dirname, "..", "bin", "HandbrakeCLI.exe");
        break;
    case "linux":
        this.HandbrakeCLIPath = "HandBrakeCLI";
        break;
    }

    /* for test scripts */
    cp = (mocks && mocks.cp) || origCp;
    this.HandbrakeCLIPath = (mocks && mocks.HandbrakeCLIPath) || this.HandbrakeCLIPath;
}
util.inherits(Handbrake, EventEmitter);

/**
begin the encode.. attach desired listeners before running
@returns this
*/
Handbrake.prototype.run = function(){
    var self = this;

    if (!this.options.valid){
        var err = new Error();
        err.message = "Invalid HandbrakeCLI options: " + this.options.validationMessages;
        this._emitError(err);
        return;
    }    

    var handle = cp.spawn(this.HandbrakeCLIPath, this.options.toArray());

    handle.stdout.setEncoding("utf-8");
    handle.stderr.setEncoding("utf-8");

    handle.stdout.on("data", function(chunk){
        if (progress.pattern.test(chunk)) {
            self._emitProgress(progress.parse(chunk));
        }
        self._emitOutput(chunk);
    });

    handle.stderr.on("data", this._emitOutput.bind(this));

    handle.on("exit", function(code){
        var err;
        if (code && code !== 0){
            err = new Error();
            err.name = "HandbrakeCLIError";
            err.message = "Handbrake failed with error code: " + code;
            err.errno = code;
            self._emitError(err);

        } else if (code === 0 && /No title found\./.test(self.allOutput)){
            err = new Error();
            err.name = "NoTitleFound";
            err.message = "Encode failed, not a video file";
            self._emitError(err);

        } else if (code === null){
            err = new Error();
            err.name = "HandbrakeCLICrash";
            err.message = "HandbrakeCLI crashed (Segmentation fault)";
            self._emitError(err);

        } else {
            var last = progress.last;
            if (last){
                last.percentComplete = 100;
                self._emitProgress(last);
            }
            self._emitComplete();
        }
    });

    handle.on("error", function (spawnError){
        var err = new Error();
        err.errno = spawnError.errno;
        err.HandbrakeCLIPath = self.HandbrakeCLIPath;
        if (spawnError.code === "ENOENT"){
            err.name = "HandbrakeCLINotFound";
            err.message = "HandbrakeCLI application not found: " + err.HandbrakeCLIPath;
            err.spawnmessage = spawnError.message;
        }
        else {
            err.name = "HandbrakeCLISpawnError";
            err.message = spawnError.message;
        }
        self._emitError(err);
    });
    
    return this;
};

/**
Fired at regular intervals passing progress information
@event Handbrake#progress
@param {Object} progress
  @param {Number} progress.percentComplete Percentage complete
  @param {Number} progress.fps Frames per second
  @param {Number} progress.avgFps Average frames per second
  @param {String} progress.eta Estimated time until completion
  @param {String} progress.task Task description, e.g. "Encoding", "Scanning" etc.
*/
Handbrake.prototype._emitProgress = function(progress){
    if (!this.inProgress) this._emitStart();
    this.emit("progress", progress);
};

/**
output buffered as-is in allOutput, trimmed before delivery to caller.
@event Handbrake#output
*/
Handbrake.prototype._emitOutput = function(output){
    this.allOutput += output;
    this.emit("output", output);
};

/**
There are four classes of error
@event Handbrake#error
@param {Error} error
*/
Handbrake.prototype._emitError = function(err){
    err.output = this.allOutput;
    err.options = this.options.toJSON();
    this.emit("error", err);
};

/**
Fired on completion of a successful encode
@event Handbrake#complete
*/
Handbrake.prototype._emitComplete = function(){
    this.emit("complete");
};

/**
fired when progress begins
@event Handbrake#start
*/
Handbrake.prototype._emitStart = function(){
    this.inProgress = true;
    this.emit("start");
};
