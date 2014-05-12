var handbrakeJs = require(".."),
    path = require("path");

var options = {
    input: path.join(__dirname, "..", "test", "video", "demo.mkv"),
    output: "output.mp4",
};

handbrakeJs.spawn(options)
    .on("error", console.error)
    .on("output", console.log);
