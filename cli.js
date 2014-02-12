#!/usr/bin/env node
"use strict";

require("more-console");
var handbrake = require("./lib/handbrake"),
    spawn = require("child_process").spawn,
    util = require("util"),
    notificationTime = false,
    notificationsEnabled = true;

var notifications = setInterval(function(){
    notificationTime = true;
}, 1000 * 60 * 3);

function notify(title, message){
    spawn("terminal-notifier", [ "-title", title, "-message", message ])
        .on("error", function(err){
            notificationsEnabled = false;
            clearInterval(notifications);
        });
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

    if (notificationTime && notificationsEnabled){
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
        notificationTime = false;
    }
}

handbrake.spawn(process.argv)
    .on("output", console.log)
    .on("progress", progressEvent)
    .on("terminated", function(){
        clearInterval(notifications);
        console.red.log("terminated");
    })
    .on("error", function(err){
        clearInterval(notifications);
        console.red.log(err.message);
    })
    .on("invalid", function(msg){
        clearInterval(notifications);
        console.red.log(msg);
    })
    .on("complete", function(){
        clearInterval(notifications);
    });
