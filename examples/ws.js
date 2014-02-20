/*
Usage:
$ node ws.js <regular handbrake options>
*/

var WsServer = new require("ws-stream"),
    handbrake = require("../");

var wsServer = new WsServer({ port: 4444 });

wsServer.on("connect", function(stream){
    handbrake.spawn(process.argv)
        .on("terminated", function(){
            console.log("terminated");
        })
        .on("error", function(err){
            console.log(err.message);
        })
        .on("invalid", function(msg){
            console.log(msg);
        })
        .outputStream.pipe(stream);
});
