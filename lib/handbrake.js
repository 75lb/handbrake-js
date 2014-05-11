"use strict";
var path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    cp = require("child_process"),
    HandbrakeOptions = require("./HandbrakeOptions"),
    progress = require("./progress");

/* Module API */
exports.spawn = spawn;
exports.exec = exec;
exports.HandbrakeProcess = HandbrakeProcess;
exports.HandbrakeOptions = HandbrakeOptions;
exports._inject = _inject;

/* points to the HandbrakeCLI executable downloaded by the install script */
var _HandbrakeCLIPath = process.platform === "darwin"
    ? path.join(__dirname, "../bin/HandbrakeCLI")
    : path.join(__dirname, "..", "bin", "HandbrakeCLI.exe");

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
}

function _inject(mock){
    cp = mock || cp;
}

function HandbrakeProcess(){}
util.inherits(HandbrakeProcess, EventEmitter);

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning a handle on the running process.

@param {Object | Thing | Array} - [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@returns {HandbrakeProcess} A handle on which you can listen for events on the Handbrake process.

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
        console.error("ERROR: " + err.message);
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
    var handbrakeOptions = new HandbrakeOptions(),
        handbrakeProcess = new HandbrakeProcess(),
        allOutput = "";
    
    handbrakeOptions.set(options);
    if (!handbrakeOptions.valid) throw new Error("invalid options");
    handbrakeProcess.config = handbrakeOptions;
    
    var handle = cp.spawn(_HandbrakeCLIPath, handbrakeOptions.toArray());
    handle.stdout.setEncoding("utf-8");
    handle.stderr.setEncoding("utf-8");
    
    handle.stdout.on("data", function(chunk){
        if (progress.pattern.test(chunk)){
            handbrakeProcess.emit("progress", progress.parse(chunk));
        }
        allOutput += chunk;
    });

    handle.stderr.on("data", function(chunk){
        handbrakeProcess.emit("output", chunk);
        allOutput += chunk;
    });
    
    handle.on("exit", function(code, signal){
        if (signal === "SIGTERM"){
            /**
            Fired if Handbrake-js was killed by CTRL-C
            @event terminated
            */
            handbrakeProcess.emit("terminated");

        } else if (code && code !== 0){
            var error = "Handbrake failed, error code: " + code;

            /**
            Fired if either HandbrakeCLI crashed or ran successfully but failed to find a valid title in the input video.
            @event error
            @param {Error} error
            */
            handbrakeProcess.emit("error", new Error(error));

        } else if (code === 0 && /No title found\./.test(allOutput)){
            handbrakeProcess.emit("error", new Error("encode failed, not a video file"));

        } else if (code === null){
            var errorMsg = util.format(
                "msg: %s\noptions: %s\noutput: %s",
                "Handbrake crashed (Segmentation fault)",
                util.inspect(handbrakeOptions.toJSON()),
                allOutput
            );
            handbrakeProcess.emit("error", new Error(errorMsg));

        } else {
            /**
            Fired on completion of a successful encode
            @event complete
            */
            var last = progress.last;
            if (last){
                last.percentComplete = 100;
                handbrakeProcess.emit("progress", last);
            }
            handbrakeProcess.emit("complete");
        }
    });
    
    handle.on('error', function (err){
        process.removeListener("SIGINT", sigInt);
        if (err.code === 'ENOENT'){
            self.emit('error', new Error('handbrakejs spawn error: ' + _HandbrakeCLIPath + ' is not installed.'));
        }
        else{
            self.emit('error', new Error('handbrakejs spawn error: ' + err));
        }
    });

    return handbrakeProcess;
}
