var net = require("net"),
    handbrake = require("../");

var server = net.createServer(function(socket){
    socket.pipe(handbrake.stream).pipe(socket);
});
