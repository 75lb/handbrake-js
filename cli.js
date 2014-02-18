#!/usr/bin/env node
"use strict";

require("more-console");
var handbrake = require("./lib/handbrake"),
    spawn = require("child_process").spawn,
    util = require("util");

var notification = {
    intervalTimePeriod: 1000 * 60 * 3,
    time: false,
    enabled: true,
    start: function(){
        this.loop = setInterval(function(){
            notification.time = true;
        }, this.intervalTimePeriod);
    },
    stop: function(){
        clearInterval(this.loop);
    },
    send: function(title, message){
        if (this.time && this.enabled){
            spawn("terminal-notifier", [ "-title", title, "-message", message ])
                .on("error", function(err){
                    notification.enabled = false;
                    notification.stop();
                });
        }
        this.time = false;
    }
}

function progressEvent(progress){
    var full = "Task %d of %d, %s: %s% complete [%s fps, %s average fps, eta: %s]",
        short = "Task %d of %d, %s: %s% complete";
    if(progress.fps){
        console.log(
            full, progress.taskNumber, progress.taskCount,
            progress.task, progress.percentComplete, progress.fps,
            progress.avgFps, progress.eta
        );
    } else {
        console.log(short, progress.taskNumber, progress.taskCount, progress.task, progress.percentComplete);
    }

    notification.send(
        this.config.input,
        util.format(
            "%s% complete [%s fps, %s avg fps, %s remaining]",
            progress.percentComplete,
            progress.fps,
            progress.avgFps,
            progress.eta
        )
    );
}

var handle = handbrake.spawn(process.argv)
    .on("progress", progressEvent)
    .on("terminated", function(){
        notification.stop();
        console.red.log("terminated");
    })
    .on("error", function(err){
        notification.stop();
        console.red.log(err.message);
    })
    .on("invalid", function(msg){
        notification.stop();
        console.red.log(msg);
    })
    .on("complete", function(){
        notification.stop();
    });
handle.outputStream.pipe(process.stdout);

notification.start();
