#!/usr/bin/env node
"use strict";

var handbrake = require("./lib/handbrake"),
    util = require("util");

var log = console.log;

function red(txt){
    return "\x1b[31m" + txt + "\x1b[0m";
}

handbrake.create()
    .on("output", log)
    .on("progress", function(progress){
        // log(progress);
        var full = "%s: %s\% complete [%s fps, %s average fps, eta: %s]",
            short = "%s: %s\% complete";
        if(progress.fps){
            log(full, progress.task, progress.percentComplete, progress.fps, progress.avgFps, progress.eta);
        } else {
            log(short, progress.task, progress.percentComplete);
        }
    })
    .on("terminated", function(){ log(red("terminated")); })
    .on("error", function(err){
        log(red(err.message));
    })
    .on("invalid", log)
    .run(process.argv);
