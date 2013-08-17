#!/usr/bin/env node
"use strict";

var handbrake = require("./lib/handbrake"),
    util = require("util");

var log = console.log;

function red(txt){
    return "\x1b[31m" + txt + "\x1b[0m";
}

// handbrake.run(process.argv)
//     .on("output", log)
//     .on("progress", function(encode){
//         var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]",
//             short = "encode: %d\% complete";
//         if(encode.fps){
//             log(full, encode.percentComplete, encode.fps, encode.avgFps, encode.eta);
//         } else {
//             log(short, encode.percentComplete);
//         }
//     })
//     .on("complete", function(){ log("complete"); })
//     .on("terminated", function(){ log("terminated"); })
//     .on("error", function(err){
//         log(red(err.message));
//     })
//     .on("invalid", function(msg){
//         log(msg);
//     });

handbrake.create()
    .on("output", log)
    .on("progress", function(progress){
        var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]",
            short = "encode: %d\% complete";
        if(progress.fps){
            log(full, progress.percentComplete, progress.fps, progress.avgFps, progress.eta);
        } else {
            log(short, progress.percentComplete);
        }
    })
    .on("complete", function(){ log("complete"); })
    .on("terminated", function(){ log("terminated"); })
    .on("error", function(err){
        log(red(err.message));
    })
    .on("invalid", log)
    .run(process.argv);
