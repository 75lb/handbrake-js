var WsServer = new require("ws-server"),
    handbrake = require("../");

/*
Launch a websocket server on port 4444. 
*/
var wsServer = new WsServer({ port: 4444 });

/*
When a client connects, listen for the websocket to become readable then pass the received
options to Handbrake. Pipe the handbrake outputStream back to the client via the websocket. 
*/
wsServer.on("connection", function(websocket){
    websocket.on("readable", function(){
        var chunk;
        while((chunk = this.read()) !== null){
            try{
                var options = JSON.parse(chunk.toString());
                process.chdir(__dirname);
                handbrake.spawn(options)
                    .on("terminated", function(){
                        console.log("terminated");
                    })
                    .on("error", function(err){
                        console.log(err.message);
                    })
                    .on("invalid", function(msg){
                        console.log(msg);
                    })
                    .outputStream.pipe(websocket);
            } catch(e){}
        }
    });
});
