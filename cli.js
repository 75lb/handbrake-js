#!/usr/bin/env node

var handbrake = require("./lib/handbrake");

process.argv.splice(0, 2);

function log(){ 
    console.log.apply(this, Array.prototype.slice.call(arguments)); 
}

handbrake.run(process.argv)
    .on("output", log)
    .on("progress", function(encode){
        var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]",
            short = "encode: %d\% complete";
        if(encode.fps){
            log(full, encode.percentComplete, encode.fps, encode.avgFps, encode.eta);
        } else {
            log(short, encode.percentComplete);
        }
    })
    .on("complete", function(){ log("complete"); })
    .on("terminated", function(){ log("terminated"); })
    .on("error", log);
