#!/usr/bin/env node
"use strict";

var dope = require("console-dope");
var cliArgs = require("command-line-args");
var hbjs = require("../lib/handbrake-js");

var cli = cliArgs(hbjs.cliOptions);
try {
    var handbrakeOptions = cli.parse().handbrake;
} catch(err){
    halt(err);
}

function onProgress(progress){
    dope.column(1).write(progress.task + "  ");
    dope.column(11).write(progress.percentComplete.toFixed(2) + "   ");
    dope.column(22).write(progress.fps.toFixed(2) + "   ");
    dope.column(32).write(progress.avgFps.toFixed(2) + "   ");
    dope.column(42).write(progress.eta);
}

function halt(err){
    dope.red.error(err);
    process.exit(1);
}

/* user intends to encode, so attach progress reporter (unless --verbose was passed) */
if (handbrakeOptions.input && handbrakeOptions.output){
    var handbrake = hbjs.spawn(handbrakeOptions)
        .on("error", halt)
        .on("complete", dope.log);

    if (handbrakeOptions.verbose){
        handbrake.on("output", dope.write);
    } else {
        handbrake
            .on("begin", function(){
                dope.bold.log("Task      % done     FPS       Avg FPS   ETA");
                this.began = true;
            })
            .on("progress", onProgress)
            .on("complete", function(){
                if (!this.began) dope.error(this.output);
            });
    }
    
} else {
    hbjs.spawn(handbrakeOptions)
        .on("error", halt)
        .on("output", dope.write);
}
