var net = require("net"),
    handbrake = require("../"),
    monitor = require("../lib/monitor");

net.createServer()
    .on("connection", function(socket){
        var handbrakeStream = handbrake.createStream();
        // monitor(handbrakeStream);
        // monitor(socket);
        socket.pipe(handbrakeStream).pipe(socket);
    })
    .listen(3338);
