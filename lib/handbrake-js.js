"use strict";
var path = require("path"),
    util = require("util"),
    HandbrakeOptions = require("./HandbrakeOptions"),
    Handbrake = require("./Handbrake");

/* handbrake-js API */
exports.spawn = spawn;
exports.HandbrakeOptions = HandbrakeOptions;
exports.Handbrake = Handbrake;

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning a handle on the running process.

All errors are delivered via the "error" event. 

@param {Object | Array} - [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@param {Object} [mocks] - Optional mock objects, for testing
@returns {Handbrake} A handle on which you can listen for events on the Handbrake process.

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
function spawn(options, mocks){
    var handbrake = new Handbrake(mocks);

    /* defer so caller can receive and attach event listers to the returned handbrake first */
    process.nextTick(function(){
        handbrake.options.set(options);
        handbrake.run();
    });

    return handbrake;
}
