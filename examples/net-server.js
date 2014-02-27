var net = require("net"),
    handbrake = require("../"),
    streaming = require("../lib/streaming");

net.createServer()
    .on("connection", function(socket){
        var handbrakeStream = handbrake.createStream();
        socket.pipe(handbrakeStream).pipe(socket);
    })
    .listen(3338);
