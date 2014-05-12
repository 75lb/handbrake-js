#!/usr/bin/env node
"use strict";

var dope = require("console-dope"),
    handbrake = require("../lib/handbrake"),
    HandbrakeOptions = require("../lib/HandbrakeOptions"),
    util = require("util");

var handbrakeOptions = new HandbrakeOptions();
handbrakeOptions.set(process.argv);

function onProgress(progress){
    dope.column(1).write(progress.task + "  ");
    dope.column(11).write(progress.percentComplete.toFixed(2) + "   ");
    dope.column(22).write(progress.fps.toFixed(2) + "   ");
    dope.column(32).write(progress.avgFps.toFixed(2) + "   ");
    dope.column(42).write(progress.eta);
}

if (handbrake.input && handbrake.output){
    var handbrakeProcess = handbrake.spawn(handbrakeOptions)
        .on("error", function(err){
            dope.red.log(err);
        })
        .on("complete", function(){
            dope.log();
        });
    
    if (handbrakeOptions.verbose){
        handbrakeProcess.on("output", dope.write);
    } else {
        handbrakeProcess.on("start", function(){
            dope.bold.log("Task      % done     FPS       Avg FPS   ETA");
        });    
        handbrakeProcess.on("progress", onProgress)
    }
} else {
    handbrakeProcess.on("output", dope.write);
    handbrake.spawn({ help: true });
}

