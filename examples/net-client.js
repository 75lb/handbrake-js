var net = require("net");

net.connect({ port: 3338 })
    .on("connect", function(){
        this.write(JSON.stringify({ input: "test_big.mp4", output: "demo.mp4" }));
    })
    .pipe(process.stdout);
