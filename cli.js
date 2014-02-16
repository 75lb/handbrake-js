#!/usr/bin/env node
"use strict";

require("more-console");
var handbrake = require("./lib/handbrake"),
    spawn = require("child_process").spawn,
    util = require("util");

var notification = {
    time: false,
    enabled: true,
    loop: setInterval(function(){
        notification.time = true;
    }, 1000 * 60 * 3),
    stop: function(){
        clearInterval(notification.loop);
    },
    send: function notify(title, message){
        spawn("terminal-notifier", [ "-title", title, "-message", message ])
            .on("error", function(err){
                notification.enabled = false;
                notification.stop();
            });
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

    if (notification.time && notification.enabled){
        notify(
            this.config.input,
            util.format(
                "%s% complete [%s fps, %s avg fps, %s remaining]",
                progress.percentComplete,
                progress.fps,
                progress.avgFps,
                progress.eta
            )
        );
        notification.time = false;
    }
}

handbrake.spawn(process.argv)
    .on("output", console.log)
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
