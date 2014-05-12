#!/usr/bin/env node
"use strict";

var dope = require("console-dope"),
    handbrakeJs = require("../lib/handbrake-js"),
    HandbrakeOptions = require("../lib/HandbrakeOptions"),
    util = require("util"),
    fs = require("fs"),
    path = require("fs");

var handbrakeOptions = new HandbrakeOptions();
handbrakeOptions.set(process.argv);

function onProgress(progress){
    dope.column(1).write(progress.task + "  ");
    dope.column(11).write(progress.percentComplete.toFixed(2) + "   ");
    dope.column(22).write(progress.fps.toFixed(2) + "   ");
    dope.column(32).write(progress.avgFps.toFixed(2) + "   ");
    dope.column(42).write(progress.eta);
}

function onError(err){
    dope.red.error(err);
    process.exit(1);
};

if (handbrakeOptions.input && handbrakeOptions.output){
    var handbrake = handbrakeJs.spawn(handbrakeOptions)
        .on("error", onError)
        .on("complete", function(){
            dope.log();
        });
    
    if (handbrakeOptions.verbose){
        handbrake.on("output", dope.write);
    } else {
        handbrake.on("start", function(){
            dope.bold.log("Task      % done     FPS       Avg FPS   ETA");
        });    
        handbrake.on("progress", onProgress)
    }
} else {
    var handbrake = handbrakeJs.spawn({ help: true })
        .on("error", onError)
        .on("output", dope.write);
}

