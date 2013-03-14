#!/usr/bin/env node

var handbrake = require("./lib/handbrake"),
    util = require("util");

process.argv.splice(0, 2);

function log(){ 
    process.stdout.write(util.format.apply(this, Array.prototype.slice.call(arguments)));
}

handbrake.run(process.argv)
    .on("output", log)
    .on("progress", function(encode){
        var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]\n",
            short = "encode: %d\% complete\n";
        if(encode.fps){
            log(full, encode.percentComplete, encode.fps, encode.avgFps, encode.eta);
        } else {
            log(short, encode.percentComplete);
        }
    })
    .on("complete", function(){ log("complete\n"); })
    .on("terminated", function(){ log("terminated\n"); })
    .on("error", function(err){
        log(err);
        log("\n");
    });
