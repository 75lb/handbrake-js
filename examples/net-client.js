var net = require("net"),
    fs = require("fs"),
    monitor = require("../lib/monitor");
    
var socket = net.connect({ port: 3338 });
// monitor(socket, "net-client");
socket.on("connect", function(){
    this.write(JSON.stringify({ input: "demo.mkv", output: "demo.mp4" }));
    this.on("readable", function(){
        var chunk;
        while((chunk = this.read()) !== null){
            var chunkString = chunk.toString();
            console.log(chunkString);
            // var data = JSON.parse(chunkString);
            // console.log(data.info || data.progress);
        }
    });
});
