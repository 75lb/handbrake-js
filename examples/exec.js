var hbjs = require(".."),
    path = require("path");

var options = {
    input: path.join(__dirname, "..", "test", "video", "demo.mkv"),
    output: "output.mp4"
};

hbjs.exec(options, function(err, stdout, stderr){
    if (err) throw err;
    console.log("STDERR:", stderr);
    console.log("STDOUT:", stdout);
});
