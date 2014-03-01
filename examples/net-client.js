var net = require("net");
    
net.connect({ port: 3338 }, function(){
    this.write(JSON.stringify({ input: "demo.mkv", output: "demo.mp4" }));
}).pipe(process.stdout);
