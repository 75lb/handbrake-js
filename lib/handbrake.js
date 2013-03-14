/**
A self-sufficient, cross-platform Node.js wrapper for [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide).
@class handbrake
@static
*/

// module dependencies
var path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    cp = require("child_process"),
    nature = require("nature");

function l(msg){
    console.log.apply(null, Array.prototype.slice.call(arguments));
}

// points to the HandbrakeCLI executable downloaded by the npm install script
var _HandbrakeCLIPath = 
    process.platform == "darwin"
        ? path.join(__dirname, "../bin/HandbrakeCLI")
        : process.platform == "win32"
            ? process.arch == "x64"
                ? path.join(__dirname, "../bin/HandbrakeCLIx64.exe")
                : path.join(__dirname, "..", "bin", "HandbrakeCLIx32.exe")
            : "HandBrakeCLI";

/**
Runs HandbrakeCLI with the supplied `options`.
@method run
@param {Object|Thing|Array} options Options to pass to Handbrake
@param {Function} [onComplete] If passed, `onComplete(stdout, stderr)` will be called on completion.
@return {HandbrakeProcess} A HandbrakeProcess instance on which you can listen for events.

@example
There are two ways to invoke `run`. Method one involves listening for events: 

    var handbrake = require("handbrake-js");
    
    var options = {
        input: "Eight Miles High.mov",
        output: "Eight Miles High.m4v",
        preset: "Normal"
    };
    
    handbrakeCLI.run(options)
        .on("output", console.log);
        .on("progress", function(encode){
            console.log(encode.percentComplete);
        })
        .on("complete", function(){ 
            console.log("Encode complete"); 
        });

The second method is to pass an `onComplete` callback. It's more convenient for short duration tasks: 
@example
    handbrake.run({ preset-list: true }, function(stdout, stderr){
        console.log(stdout);
    });
    
*/
exports.run = function(options, onComplete){
    var config = exports.run.config.set(options);

    if (onComplete){
        var cmd = util.format('"%s" %s', _HandbrakeCLIPath, config.toArray(true).join(" "));
        cp.exec(cmd, function(err, stdout, stderr){
            if (err) throw err;
            onComplete(stdout, stderr);
        });
    } else {
        var handbrake = new HandbrakeProcess();

        if (!config.valid){
            process.nextTick(function(){ handbrake.emit("error", config.errors); });
            return handbrake;
        }

        var output = "",
            handle = cp.spawn(_HandbrakeCLIPath, config.toArray());

        handbrake.args = config;
        handle.stdout.setEncoding("utf-8");
        handle.stderr.setEncoding("utf-8");

        handle.stdout.on("data", function(data){
            output += data;
            if (/Encoding:/.test(data)){
                var match = data.match(/task 1 of 1, (.*) %( \((.*?) fps, avg (.*?) fps, ETA (.*?)\))?/);
                handbrake.emit("progress", {
                    percentComplete: match[1],
                    fps: +match[3],
                    avgFps: +match[4],
                    eta: match[5]
                });
            } else {
                handbrake.emit("output", data);
            }
        });
        
        handle.stderr.on("data", function(data){
            output += data;
            handbrake.emit("output", data);
        });

        handle.on("exit", function(code, signal){
            // Handbrake was killed
            if (signal == "SIGTERM"){
                handbrake.emit("terminated");

            // Handbrake failed
            } else if (code && code != 0){
                var error = util.format(
                    "code: %s\noptions: %s\noutput: %s", 
                    code, 
                    util.inspect(config.toJSON()), 
                    output
                );
                handbrake.emit("error", new Error(error));

            // Handbrake completed but failed to find video content
            } else if (code == 0 && /No title found\./.test(output)){
                handbrake.emit("error", new Error("encode failed, not a video file"));

            // Handbrake seg faulted
            } else if (code == null){
                var error = util.format(
                    "msg: %s\noptions: %s\noutput: %s", 
                    "Handbrake crashed (Segmentation fault)", 
                    util.inspect(config.toJSON()), 
                    output
                );
                handbrake.emit("error", new Error(error));

            // Handbrake completed successfully
            } else {
                handbrake.emit("complete");
            }
        });

        // propogate CTRL+C to Handbrake process
        process.on("SIGINT", function(){
            handle.kill();
        });
        return handbrake;
    }
};
exports.run.config = new nature.Thing()
    .define("general", [
        { name: "help", type: "boolean", alias: "h" },
        { name: "verbose", type: "boolean", alias: "v" },
        { name: "input", type: "string", alias: "i" },
        { name: "output", type: "string", alias: "o" },
        { name: "update", type: "boolean", alias: "u" },
        { name: "preset", type: "string", alias: "Z" },
        { name: "preset-list", type: "boolean", alias: "z" },
        { name: "no-dvdnav", type: "boolean" }
    ])
    .define("source", [
        { name: "title", type: "number", alias: "t" },
        { name: "min-duration", type: "number" },
        { name: "scan", type: "boolean" },
        { name: "main-feature", type: "boolean" },
        { name: "chapters", type: "string", alias: "c" },
        { name: "angle", type: "number" },
        { name: "previews", type: "string" },
        { name: "start-at-preview", type: "string" },
        { name: "start-at", type: "string", valueTest: /duration:|frame:|pts:/, valueFailMsg: "please specify the unit, e.g. --start-at duration:10 or --start-at frame:2000" },
        { name: "stop-at", type: "string", valueTest: /duration:|frame:|pts:/, valueFailMsg: "please specify the unit, e.g. --stop-at duration:100 or --stop-at frame:3000" }
    ])
    .define("destination", [
        { name: "format", type: "string", alias: "f" },
        { name: "markers", type: "boolean", alias: "m" },
        { name: "large-file", type: "boolean", alias: "4" },
        { name: "optimize", type: "boolean", alias: "O" },
        { name: "ipod-atom", type: "boolean", alias: "I" }
    ])
    .define("video", [
        { name: "encoder", type: "string", alias: "e" },
        { name: "x264-preset", type: "string" },
        { name: "x264-tune", type: "string" },
        { name: "encopts", type: "string", alias: "x" },
        { name: "x264-profile", type: "string" },
        { name: "quality", type: "number", alias: "q" },
        { name: "vb", type: "number", alias: "b" },
        { name: "two-pass", type: "boolean", alias: "2" },
        { name: "turbo", type: "boolean", alias: "T" },
        { name: "rate", type: "number", alias: "r" },
        { name: "vfr", type: "boolean" },
        { name: "cfr", type: "boolean" },
        { name: "pfr", type: "boolean" }
    ])
    .define("audio", [
        { name: "audio", type: "string", alias: "a" },
        { name: "aencoder", type: "string", alias: "E" },
        { name: "audio-copy-mask", type: "string" },
        { name: "audio-fallback", type: "string" },
        { name: "ab", type: "string", alias: "B" },
        { name: "aq", type: "string", alias: "Q" },
        { name: "ac", type: "string", alias: "C" },
        { name: "mixdown", type: "string", alias: "6" },
        { name: "arate", type: "string", alias: "R" },
        { name: "drc", type: "number", alias: "D" },
        { name: "gain", type: "number" },
        { name: "aname", type: "string", alias: "A" }
    ])            
    .define("picture", [
        { name: "width", type: "number", alias: "w" },
        { name: "height", type: "number", alias: "l" },
        { name: "crop", type: "string" },
        { name: "loose-crop", type: "number" },
        { name: "maxHeight", type: "number", alias: "Y" },
        { name: "maxWidth", type: "number", alias: "X" },
        { name: "strict-anamorphic", type: "boolean" },
        { name: "loose-anamorphic", type: "boolean" },
        { name: "custom-anamorphic", type: "boolean" },
        { name: "display-width", type: "number" },
        { name: "keep-display-aspect", type: "boolean" },
        { name: "pixel-aspect", type: "string" },
        { name: "itu-par", type: "boolean" },
        { name: "modulus", type: "number" },
        { name: "color-matrix", type: "string", alias: "M" }
    ])            
    .define("filters", [
        { name: "deinterlace", type: "string", alias: "d" },
        { name: "decomb", type: "string", alias: "5" },
        { name: "detelecine", type: "string", alias: "9" },
        { name: "denoise", type: "string", alias: "8" },
        { name: "deblock", type: "string", alias: "7" },
        { name: "rotate", type: "number" },
        { name: "grayscale", type: "boolean", alias: "g" }
    ])
    .define("subtitle", [
        { name: "subtitle", type: "string", alias: "s" },
        { name: "subtitle-forced", type: "number" },
        { name: "subtitle-burn", type: "number" },
        { name: "subtitle-default", type: "number" },
        { name: "native-language", type: "string", alias: "N" },
        { name: "native-dub", type: "boolean" },
        { name: "srt-file", type: "string" },
        { name: "srt-codeset", type: "string" },
        { name: "srt-offset", type: "string" },
        { name: "srt-lang", type: "string" },
        { name: "srt-default", type: "number" }
    ]);

exports._inject = function(mock){
    cp = mock || cp;   
};
exports.HandbrakeProcess = HandbrakeProcess;

/**
A handle on the Handbrake encoding process, used to catch and respond to run-time events.
@class HandbrakeProcess
@constructor
*/
function HandbrakeProcess(){
    EventEmitter.call(this);
}
util.inherits(HandbrakeProcess, EventEmitter);
/**
Fired on successful completion
@event complete
*/
/**
@event error
@param {String} code
@param {Object} options
@param {String} output
*/
/**
Fired if Handbrake-js was killed by CTRL-C
@event terminated
*/
/**
Fired on Handbrake output
@event output
@param {String} output
*/
/**
Fired at regular intervals throughout the encoding process
@event progress
@param {Object} progress
  @param {Number} progress.percentComplete
  @param {Number} progress.fps 
  @param {Number} progress.avgFps
  @param {String} progress.eta 
*/