"use strict";
var HandbrakeOptions = require("./HandbrakeOptions"),
    Handbrake = require("./Handbrake");

/* handbrake-js API */
exports.spawn = spawn;
exports.HandbrakeOptions = HandbrakeOptions;
exports.Handbrake = Handbrake;

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning an instance of `Handbrake` which you can monitor for events.

All errors are delivered via the "error" event.

@param {Object | Array} - [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@param {Object} [mocks] - Optional mock objects, for testing
@returns {Handbrake} A handle on which you can listen for events on the Handbrake process.

@example
```js
var handbrakeJs = require("handbrake-js");

handbrakeJs.spawn(options)
    .on("error", console.error)
    .on("output", console.log);
```
*/
function spawn(options, mocks){
    var handbrake = new Handbrake(mocks);

    /* defer so caller can receive and attach event listers to the returned handbrake first */
    process.nextTick(function(){
        try {
            handbrake.options.set(options);
        } catch (err){
            handbrake._emitError(err);
        }
        handbrake.run();
    });

    return handbrake;
}
