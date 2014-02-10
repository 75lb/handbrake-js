#!/usr/bin/env node
"use strict";

var handbrake = require("./lib/handbrake"),
    spawn = require("child_process").spawn,
    w = require("wodge"),
    util = require("util"),
    log = console.log,
    notificationTime = false,
    notificationsEnabled = true;

function notify(title, message){
    spawn("terminal-notifier", [ "-title", title, "-message", message ])
        .on("error", function(err){
            notificationsEnabled = false;
        });
}

function progressEvent(progress){
    var full = "Task %d of %d, %s: %s% complete [%s fps, %s average fps, eta: %s]",
        short = "Task %d of %d, %s: %s% complete";
    if(progress.fps){
        log(
            full, progress.taskNumber, progress.taskCount,
            progress.task, progress.percentComplete, progress.fps, 
            progress.avgFps, progress.eta
        );
    } else {
        log(short, progress.taskNumber, progress.taskCount, progress.task, progress.percentComplete);
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

var notifications = setInterval(function(){
    notificationTime = true;
}, 1000 * 60 * 3);

handbrake.spawn(process.argv)
    .on("output", log)
    .on("progress", progressEvent)
    .on("terminated", function(){ 
        clearInterval(notifications);
        log(w.red("terminated")); 
    })
    .on("error", function(err){
        clearInterval(notifications);
        log(w.red(err.message));
    })
    .on("invalid", log)
    .on("complete", function(){
        clearInterval(notifications);
    });
