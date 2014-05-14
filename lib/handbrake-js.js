"use strict";
var HandbrakeOptions = require("./HandbrakeOptions"),
    Handbrake = require("./Handbrake");

/** 
handbrake-js package API
@module
*/
exports.spawn = spawn;
exports.HandbrakeOptions = HandbrakeOptions;
exports.Handbrake = Handbrake;

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning an instance of `Handbrake` on which you can listen for events.

@param options {Object | Array} - [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@param [mocks] {Object} - Optional mock objects, for testing
@returns {Handbrake} A handle on which you can listen for events on the Handbrake process.

@example
    var handbrakeJs = require("handbrake-js");

    handbrakeJs.spawn(options)
        .on("error", console.error)
        .on("output", console.log);
*/
function spawn(options, mocks){
    var handbrake = new Handbrake(mocks);

    /* defer so caller can receive and attach event listers to the returned handbrake first */
    process.nextTick(function(){
        try {
            handbrake.options.set(options);
            handbrake.run();
        } catch (error){
            var err = new Error();
            err.message = error.message;
            err.name = "InvalidOption";
            handbrake._emitError(err);
        }
    });

    return handbrake;
}
