var net = require("net"),
    handbrake = require("../");

net.createServer()
    .on("connection", function(socket){
        socket.pipe(handbrake.createStream()).pipe(socket);
    })
    .listen(3338);
