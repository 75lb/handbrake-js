#!/usr/bin/env node
"use strict";

var handbrake = require("./lib/handbrake"),
    util = require("util"),
    log = console.log;

function red(txt){
    return "\x1b[31m" + txt + "\x1b[0m";
}

handbrake.spawn(process.argv)
    .on("output", log)
    .on("progress", function(progress){
        var full = "Task %d of %d, %s: %s\% complete [%s fps, %s average fps, eta: %s]",
            short = "Task %d of %d, %s: %s\% complete";
        if(progress.fps){
            log(
                full, progress.taskNumber, progress.taskCount,
                progress.task, progress.percentComplete, progress.fps, 
                progress.avgFps, progress.eta
            );
        } else {
            log(short, progress.taskNumber, progress.taskCount, progress.task, progress.percentComplete);
        }
    })
    .on("terminated", function(){ log(red("terminated")); })
    .on("error", function(err){
        log(red(err.message));
    })
    .on("invalid", log);
