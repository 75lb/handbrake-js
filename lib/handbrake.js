"use strict";
var path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    cp = require("child_process"),
    HandbrakeOptions = require("./HandbrakeOptions"),
    HandbrakeProcess = require("./HandbrakeProcess"),
    progress = require("./progress");

/* handbrake-js API */
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

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning a handle on the running process.

@param {Object | Model | Array} - [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
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
    var handbrakeOptions = new HandbrakeOptions();
    handbrakeOptions.set(options);
    
    if (!handbrakeOptions.valid) throw new Error("invalid options");
    
    var handle = cp.spawn(_HandbrakeCLIPath, handbrakeOptions.toArray());
    return new HandbrakeProcess(handle, handbrakeOptions);    
}
