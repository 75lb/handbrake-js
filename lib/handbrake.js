"use strict";
var path = require("path"),
    util = require("util"),
    cp = require("child_process"),
    HandbrakeOptions = require("./HandbrakeOptions"),
    HandbrakeProcess = require("./HandbrakeProcess");

/* handbrake-js API */
exports.spawn = spawn;
exports.HandbrakeProcess = HandbrakeProcess;
exports.HandbrakeOptions = HandbrakeOptions;
exports._inject = _inject;

/* points to the HandbrakeCLI executable downloaded by the install script */
var _HandbrakeCLIPath = process.platform === "darwin"
    ? path.join(__dirname, "../bin/HandbrakeCLI")
    : path.join(__dirname, "..", "bin", "HandbrakeCLI.exe");
var HandbrakeCLIPath = _HandbrakeCLIPath;

/* for the test scripts */
function _inject(mocks){
    cp = mocks.cp || require("child_process");
    HandbrakeCLIPath = mocks.HandbrakeCLIPath || _HandbrakeCLIPath;
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
    
    var handle = cp.spawn(HandbrakeCLIPath, handbrakeOptions.toArray());
    handbrakeOptions.HandbrakeCLIPath = HandbrakeCLIPath;
    return new HandbrakeProcess(handle, handbrakeOptions);    
}
