/*
Usage:
$ node ws.js <any video file>
*/

var WsServer = new require("ws-stream"),
    fs = require("fs"),
    handbrake = require("../");

var wsServer = new WsServer({ port: 4444 });

wsServer.on("connect", function(stream){
    var handle = handbrake.spawn({ input: process.argv[2], output: "output.mp4" });
    handle.outputStream.pipe(stream);
});
