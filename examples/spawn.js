var hbjs = require(".."),
    path = require("path");

var options = {
    input: path.join(__dirname, "..", "test", "video", "demo.mkv"),
    output: "output.mp4"
};

hbjs.spawn(options)
    .on("error", console.error)
    .on("output", process.stdout.write.bind(process.stdout));
