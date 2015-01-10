"use strict";
var path = require("path"),
    util = require("util"),
    cp = require("child_process"),
    EventEmitter = require("events").EventEmitter,
    progress = require("./progress"),
    toSpawnArgs = require("object-to-spawn-args"),
    config = require("./config");

module.exports = Handbrake;

var origCp = cp;

/**
@class
@classdesc A thin wrapper on the handbrakeCLI child_process handle. An instance of this class is returned by {@link module:handbrake-js.spawn}.
@extends external:EventEmitter
@emits module:handbrake-js~Handbrake#event:start
@emits module:handbrake-js~Handbrake#event:begin
@emits module:handbrake-js~Handbrake#event:progress
@emits module:handbrake-js~Handbrake#event:output
@emits module:handbrake-js~Handbrake#event:error
@emits module:handbrake-js~Handbrake#event:end
@emits module:handbrake-js~Handbrake#event:complete
@memberof module:handbrake-js
@inner
*/
function Handbrake(mocks){
    /**
    A `String` containing all handbrakeCLI output
    @type {string}
    */
    this.output = "";
    /* `true` while encoding  */
    this._inProgress = false;
    /**
    the options HandbrakeCLI was spawned with
    @type {object}
    */
    this.options = null;

    /* path to the HandbrakeCLI executable downloaded by the install script */
    this.HandbrakeCLIPath = config.HandbrakeCLIPath;

    /* for test scripts */
    cp = (mocks && mocks.cp) || origCp;
    this.HandbrakeCLIPath = (mocks && mocks.HandbrakeCLIPath) || this.HandbrakeCLIPath;
}
util.inherits(Handbrake, EventEmitter);

/* ensure user has had chance to attach event listeners before calling */
Handbrake.prototype._run = function(){
    var self = this,
        err = new Error();

    if (this.options.input !== undefined && this.options.output !== undefined){
        var pathsEqual = path.resolve(this.options.input) === path.resolve(this.options.output);
        if (pathsEqual){
            err.name = "ValidationError";
            err.message = "input and output paths are the same";
            this._emitError(err);
            return;
        }
    }

    this._emitStart();
    var handle = cp.spawn(this.HandbrakeCLIPath, toSpawnArgs(this.options));

    handle.stdout.setEncoding("utf-8");
    handle.stderr.setEncoding("utf-8");

    var buffer = "";
    handle.stdout.on("data", function(chunk){
        buffer += chunk;

        if (progress.long.pattern.test(buffer)) {
            self._emitProgress(progress.long.parse(buffer));
            buffer = buffer.replace(progress.long.pattern, "");

        } else if (progress.short.pattern.test(buffer)) {
            self._emitProgress(progress.short.parse(buffer));
            buffer = buffer.replace(progress.short.pattern, "");

        } else if (progress.muxing.pattern.test(buffer)) {
            self._emitProgress(progress.muxing.parse(buffer));
            buffer = buffer.replace(progress.muxing.pattern, "");
        }
        self._emitOutput(chunk);
    });

    handle.stderr.on("data", this._emitOutput.bind(this));

    handle.on("exit", function(code){
        if (code && code !== 0){
            err = new Error();
            err.name = "HandbrakeCLIError";
            err.message = "Handbrake failed with error code: " + code;
            err.errno = code;
            self._emitError(err);

        } else if (code === 0 && /No title found\./.test(self.output)){
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
            if (self._inProgress){
                var last = progress.last;
                if (last){
                    last.percentComplete = 100;
                    self._emitProgress(last);
                }
                self._emitEnd();
            }
        }
        self._emitComplete();
    });

    handle.on("error", function (spawnError){
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
        self._emitComplete();
    });

    return this;
};

/**
Fired as HandbrakeCLI is launched. Nothing has happened yet.
@event module:handbrake-js~Handbrake#start
*/
Handbrake.prototype._emitStart = function(){
    this.emit("start");
};

/**
Fired when encoding begins. If you're expecting an encode and this never fired, something went wrong.
@event module:handbrake-js~Handbrake#begin
*/
Handbrake.prototype._emitBegin = function(){
    this._inProgress = true;
    this.emit("begin");
};

/**
Fired at regular intervals passing a `progress` object.

@event module:handbrake-js~Handbrake#progress
@param progress {object} - details of encode progress
@param progress.taskNumber {number} - current task index
@param progress.taskCount {number} - total tasks in the queue
@param progress.percentComplete {number}
@param progress.fps {number} - Frames per second
@param progress.avgFps {number} - Average frames per second
@param progress.eta {string} - Estimated time until completion
@param progress.task {string} - Task description, either "Encoding" or "Muxing"
*/
Handbrake.prototype._emitProgress = function(progress){
    if (!this._inProgress) this._emitBegin();
    this.emit("progress", progress);
};

/**
@event module:handbrake-js~Handbrake#output
@param output {string} - An aggregate of `stdout` and `stderr` output from the underlying HandbrakeCLI process.
*/
Handbrake.prototype._emitOutput = function(output){
    this.output += output;
    this.emit("output", output);
};

/**
@event module:handbrake-js~Handbrake#error
@param error {Error} - All operational exceptions are delivered via this event.
@param error.name {string} One of `HandbrakeCLINotFound`, `HandbrakeCLIError`, `NoTitleFound`, `HandbrakeCLICrash` or `ValidationError`
@param error.message {string}
@param error.errno {string}
*/
Handbrake.prototype._emitError = function(err){
    err.output = this.output;
    err.options = this.options;
    this.emit("error", err);
};

/**
Fired on successful completion of an encoding task. Always follows a `begin` event, with some `progress` in between.
@event module:handbrake-js~Handbrake#end
*/
Handbrake.prototype._emitEnd = function(){
    this.emit("end");
};

/**
Fired when HandbrakeCLI exited cleanly. This does not necessarily mean your encode completed as planned..
@event module:handbrake-js~Handbrake#complete
*/
Handbrake.prototype._emitComplete = function(){
    this.emit("complete");
};

/**
@external EventEmitter
@see http://nodejs.org/api/events.html
*/
