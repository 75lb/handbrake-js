#!/usr/bin/env node
"use strict";

var dope = require("console-dope");
var handbrake = require("../lib/handbrake"),
    util = require("util");

function onProgress(progress){
    if(progress.fps){
        dope.column(1).write(progress.task);
        dope.column(11).write(progress.percentComplete.toFixed(2) + "   ");
        dope.column(22).write(progress.fps.toFixed(2) + "   ");
        dope.column(32).write(progress.avgFps.toFixed(2) + "   ");
        dope.column(42).write(progress.eta);
    } else {
        dope.column(1).write(progress.task);
        dope.column(11).write(progress.percentComplete);
    }
}

handbrake.spawn(process.argv)
    .on("start", function(){
        dope.bold.log("Task      % done     FPS       Avg FPS   ETA");
    })
    .on("progress", onProgress)
    .on("error", function(err){
        dope.red.log(err);
    })
    .on("complete", function(){
        dope.log();
    })
    // .on("output", dope.log);
