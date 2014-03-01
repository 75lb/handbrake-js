"use strict";
var path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    cp = require("child_process"),
    Thing = require("nature").Thing,
    streaming = require("./streaming"),
    HandbrakeOptions = require("./HandbrakeOptions");

/* Module API */
exports.spawn = spawn;
exports.exec = exec;
exports.HandbrakeProcess = HandbrakeProcess;
exports.HandbrakeOptions = HandbrakeOptions;
exports.createStream = createStream;
exports._inject = _inject;

/* points to the HandbrakeCLI executable downloaded by the install script */
var _HandbrakeCLIPath =
    process.platform === "darwin"
        ? path.join(__dirname, "../bin/HandbrakeCLI")
        : process.platform === "win32"
            ? process.arch === "x64"
                ? path.join(__dirname, "../bin/HandbrakeCLIx64.exe")
                : path.join(__dirname, "..", "bin", "HandbrakeCLIx32.exe")
            : "HandBrakeCLI";

/**
A handle on the Handbrake encoding process, used to catch and respond to run-time events.
@class HandbrakeProcess
@constructor
*/
function HandbrakeProcess(){
    var self = this;

    this.outputStream = new streaming.OutputStream({ highWaterMark: 30 * 1024 * 1024 });
    this.infoTransform = new streaming.InfoTransform();
    this.progressTransform = new streaming.ProgressTransform();
    // monitor(this.outputStream, this.infoTransform, this.progressTransform)
    
    this.infoTransform.on("output", function(output){
            self.emit("output", output);
        })
        .pipe(this.outputStream, { end: false });
        
    this.progressTransform.on("progress", function(progress){
            self.emit("progress", progress);
        })
        .on("muxing", function(){
            self.emit("muxing");
        })
        .pipe(this.outputStream, { end: false });
}
util.inherits(HandbrakeProcess, EventEmitter);

HandbrakeProcess.prototype.run = function(options){
    var self = this;
    var config = this.config = new exports.HandbrakeOptions()
        .on("error", function(err){
            self.emit("error", err);
        })
        .set(options);

    if (!config.valid){
        self.emit("invalid", config.validationMessages.toString());
        return;
    }

    /*
    Spawn HandbrakeCLI, piping both stdout and stderr to outputStream.
    While encoding (`--input` supplied) all text on stdout regards progress,
    so pipe it via the progressTransform.
    */
    var handle = cp.spawn(_HandbrakeCLIPath, config.toArray());
    
    handle.stdout.name = "handbrake.stdout";
    handle.stderr.name = "handbrake.stderr";

    handle.stderr.pipe(this.infoTransform, { end: false });
    if (config.input){
        handle.stdout.pipe(this.progressTransform);
    } else {
        handle.stdout.pipe(this.infoTransform);
    }

    handle.on("exit", function(code, signal){
        if (signal === "SIGTERM"){
            /**
            Fired if Handbrake-js was killed by CTRL-C
            @event terminated
            */
            self.emit("terminated");

        } else if (code && code !== 0){
            var error = "Handbrake failed, error code: " + code;

            /**
            Fired if either HandbrakeCLI crashed or ran successfully but failed to find a valid title in the input video.
            @event error
            @param {Error} error
            */
            self.emit("error", new Error(error));

        } else if (code === 0 && /No title found\./.test(self.outputStream.getAllOutput())){
            self.emit("error", new Error("encode failed, not a video file"));

        } else if (code === null){
            var errorMsg = util.format(
                "msg: %s\noptions: %s\noutput: %s",
                "Handbrake crashed (Segmentation fault)",
                util.inspect(config.toJSON()),
                self.outputStream.getAllOutput()
            );
            self.emit("error", new Error(errorMsg));

        } else {
            /**
            Fired on completion of a successful encode
            @event complete
            */
            var last = streaming.progress.last;
            if (last){
                last.percentComplete = 100;
                self.emit("progress", last);
                self.outputStream.push(JSON.stringify({ progress: last }));
            }
            self.infoTransform.push(null);
            self.progressTransform.push(null);
            self.outputStream.push(null);
            handle.stderr.unpipe(self.infoTransform);
            self.emit("complete");
        }
    });

    // propogate CTRL+C to Handbrake process
    var sigInt = function(){
        handle.kill();
    };
    process.on("SIGINT", sigInt);
    handle.on("exit", function(){
        process.removeListener("SIGINT", sigInt);
    });
};

/**
Runs HandbrakeCLI with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

@method exec
@param {Object | Thing | Array} options [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@param {Function} [onComplete] If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output.

@example
```js
var handbrake = require("handbrake-js");

handbrake.exec({ preset-list: true }, function(err, stdout, stderr){
    if (err) throw err;
    console.log(stdout);
});
```
*/
function exec(options, callback){
    var optionsError = null;

    var config = new exports.HandbrakeOptions()
        .on("error", function(err){
            optionsError = err;
        })
        .set(options);

    if (optionsError){
        callback(optionsError);
    } else {
        var cmd = util.format('"%s" %s', _HandbrakeCLIPath, config.toArray(true).join(" "));
        cp.exec(cmd, callback);
    }
};

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning a handle on the running process.
@method spawn
@param {Object | Thing | Array} options [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@return {HandbrakeProcess} A handle on which you can listen for events on the Handbrake process.

@example
```js
var handbrake = require("handbrake-js");

var options = {
    input: "Eight Miles High.mov",
    output: "Eight Miles High.m4v",
    preset: "Normal"
};

handbrake.spawn(options)
    .on("error", function(err){
        console.log("ERROR: " + err.message);
    })
    .on("output", console.log);
    .on("progress", function(progress){
        console.log(progress.task + ": " + progress.percentComplete);
    })
    .on("complete", function(){
        console.log("Done!");
    });
```
*/
function spawn(options){
    var handbrakeProcess = new HandbrakeProcess();
    process.nextTick(function(){ handbrakeProcess.run(options); });
    return handbrakeProcess;
};

function _inject(mock){
    cp = mock || cp;
};
function createStream(){
    return new streaming.HandbrakeStream();
}
