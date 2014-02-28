"use strict";
require("console-dope");
var util = require("util"),
    stream = require("stream");

module.exports = function monitor(stream, name){
    name = name || stream.constructor.name;
    console.bold.underline.log(
        "Monitoring: %s [%d, %d]", 
        name,
        stream._writableState.highWaterMark, 
        stream._readableState.highWaterMark
    );
    function logMsg(msg){
        console.underline.log(msg);
    }
    function logStats(){
        // console.dir(stream._readableState);return;
        console.log(
            "[%d, %s] %bold{%s} [%d, %s]",
            stream._writableState.length,
            util.inspect(Buffer.concat(stream._writableState.buffer).slice(0, 20).toString()),
            name,
            stream._readableState.length,
            util.inspect(Buffer.concat(stream._readableState.buffer).slice(0, 20).toString())
        );
    }
    function log(evt){
        var msg;
        if (evt === "pipe"){
            msg = util.format("%blue{PIPE: %s -> %s}", arguments[1], name);
            logMsg(msg);
        } else if (evt === "unpipe"){
            msg = util.format("%blue{UNPIPE: %s X %s}", arguments[1], name);
            logMsg(msg);
        } else if ([ "readable", "connect" ].indexOf(evt) > -1){
            msg = name + ": " + "%green{" + evt.toUpperCase() + "}";
            logMsg(msg);
            logStats();
        } else if ([ "end", "close", "finish"].indexOf(evt) > -1){
            msg = name + ": " + "%red{" + evt.toUpperCase() + "}";
            logMsg(msg);
            logStats();
        } else if (evt === "error"){
            msg = util.format("%s: %red{ERROR: %s}", name, arguments[1]);
            logMsg(msg);
            logStats();
        } else {
            msg = name + ": " + evt.toUpperCase();
            logMsg(msg);
            logStats();
        }
    }
    stream
        .on("readable", function(){ log("readable"); })
        .on("error", function(err){ log("error", err.message); })
        .on("end", function(){ log("end"); })
        .on("close", function(){ log("close"); })
        .on("drain", function(){ log("drain"); })
        .on("finish", function(){ log("finish"); })
        .on("pipe", function(src){ log("pipe", src.name || src.constructor.name); })
        .on("unpipe", function(src){ log("unpipe", src.name || src.constructor.name); })
        .on("connect", function(){ log("connect"); })
        .on("timeout", function(){ log("timeout"); });
}
