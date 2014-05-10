var WsServer = require("ws-server"),
    handbrake = require("../");

/*
Launch a websocket server on port 4444. 
*/
var wsServer = new WsServer({ port: 4444 });
process.chdir(__dirname);

/*
Pipe the incoming handbrake options through handbrake, which streams log and progress information directly back to the client
*/
wsServer.on("connection", function(websocket){
    websocket.pipe(handbrake.createStream()).pipe(websocket);
});
