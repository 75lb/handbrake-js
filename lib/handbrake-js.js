"use strict";
var HandbrakeOptions = require("./HandbrakeOptions"),
    Handbrake = require("./Handbrake");

/** 
Handbrake for node.js.
@module
*/
exports.spawn = spawn;

/**
A class which encapsulates the valid options and values for HandbrakeCLI.
*/
exports.HandbrakeOptions = HandbrakeOptions;

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning an instance of `Handbrake` on which you can listen for events.

@param options {Object | Array} - [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@param [mocks] {Object} - Optional mock objects, for testing
@returns A `Handbrake` instance

@example
    var hbjs = require("handbrake-js");

    hbjs.spawn(options)
        .on("error", console.error)
        .on("output", console.log);
*/
function spawn(options, mocks){
    var handbrake = new Handbrake(mocks);

    /* defer so the caller can attach event listers on the returned Handbrake instance first */
    process.nextTick(function(){
        try {
            handbrake.options.set(options);
            handbrake._run();
        } catch (error){
            var err = new Error();
            err.message = error.message;
            err.name = "InvalidOption";
            handbrake._emitError(err);
        }
    });

    return handbrake;
}
