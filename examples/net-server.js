var net = require("net"),
    handbrake = require("../");

process.chdir(__dirname);

net.createServer(function(socket){
    socket.pipe(handbrake.createStream()).pipe(socket);
}).listen(3338);
