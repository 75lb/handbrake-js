/*
Usage:
$ node ws-server.js

Or you can supply an --input video to encode, overriding that sent by ws-client.html (demo.mkv)
$ node ws-server.js ~/Movies/Something.mov
*/

var WsServer = require("ws-server"),
    handbrake = require("../"),
    monitor = require("stream-monitor");

/*
Launch a websocket server on port 4444. 
*/
var wsServer = new WsServer({ port: 4444 });

/*
When a client connects, listen for the websocket to become readable then pass the received
options to Handbrake. Pipe the handbrake outputStream back to the client via the websocket. 
*/
wsServer.on("connection", function(websocket){
    var h = handbrake.createStream();
    websocket.name = "websocket"; monitor(websocket); monitor(h);
    websocket.pipe(h).pipe(websocket, { end: false });
});
