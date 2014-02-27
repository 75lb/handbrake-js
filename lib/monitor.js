"use strict";
var util = require("util"),
    stream = require("stream");

module.exports = function monitor(stream, name){
    name = name || stream.constructor.name;
    function log(msg){
        console.underline.log(name + ": " + msg);
        console.log(
            "%s [%d, %d] readable: %d [%italic{%s}], writable: %d [%italic{%s}]",
            name,
            stream._readableState.highWaterMark,
            stream._writableState.highWaterMark,
            stream._readableState.length,
            util.inspect(Buffer.concat(stream._readableState.buffer).slice(0, 20).toString()),
            stream._writableState.length,
            util.inspect(Buffer.concat(stream._writableState.buffer).slice(0, 20).toString())
        );
    }
    stream
        .on("readable", function(){ log("%green{READABLE}"); })
        .on("error", function(err){ log("ERROR " + err.message); })
        .on("end", function(){ log("%red{END}"); })
        .on("close", function(){ log("%red{CLOSE}"); })
        .on("drain", function(){ log("DRAIN"); })
        .on("finish", function(){ log("%red{FINISH}"); })
        .on("pipe", function(src){ log("%blue{PIPE}: " + (src.name || src.constructor.name)); })
        .on("unpipe", function(){ log("%blue{UNPIPE}"); });
}
