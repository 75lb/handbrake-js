/*
Usage:
$ node ws.js <any video file>
*/

var WsStream = new require("ws-stream"),
    fs = require("fs"),
    handbrake = require("../");

var wsStream = new WsStream({ port: 4444 });

wsStream.on("connect", function(){
    var handle = handbrake.spawn({ input: process.argv[2], output: "output.mp4" });
    handle.outputStream.pipe(wsStream);
});
