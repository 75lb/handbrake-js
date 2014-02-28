var net = require("net"),
    handbrake = require("../"),
    monitor = require("stream-monitor");

net.createServer()
    .on("connection", function(socket){
        socket.pipe(handbrake.createStream()).pipe(socket);
    })
    .listen(3338);
