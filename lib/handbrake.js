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
    cm = require("../../config-master");

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
@param {Object|Config|Array} options Options to pass to Handbrake
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
        var cmd = util.format('"%s" %s', _HandbrakeCLIPath, config.toArray().join(" "));
        cp.exec(cmd, function(err, stdout, stderr){
            if (err) throw err;
            onComplete(stdout, stderr);
        });
    } else {
        var output = "",
            handbrake = new HandbrakeProcess(),
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
                handbrake.emit("error", {
                    exitCode: code,
                    options: config.toJSON(),
                    output: output
                });

            // Handbrake completed but failed to find video content
            } else if (code == 0 && /No title found\./.test(output)){
                handbrake.emit("error", {
                    msg: "encode failed, not a video file",
                    args: config,
                    output: output
                });

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
exports.run.config = new cm.Config()
    .group("general")
        .option("help", { type: "boolean", alias: "h" })
        .option("input", { type: "string", alias: "i" })
        .option("output", { type: "string", alias: "o" })
        .option("update", { type: "boolean", alias: "u" })
        .option("preset", { type: "string", alias: "Z" })
        .option("preset-list", { type: "boolean", alias: "z" })
        .option("no-dvdnav", { type: "boolean" })
    .group("source")
        .option("title", { type: "number", alias: "t" })
        .option("min-duration", { type: "number" })
        .option("scan", { type: "boolean" })
        .option("main-feature", { type: "boolean" })
        .option("chapters", { type: "string", alias: "c" })
        .option("angle", { type: "number" })
        .option("previews", { type: "string" })
        .option("start-at-preview", { type: "string" })
        .option("start-at", { type: "string" })
        .option("stop-at", { type: "string" })
    .group("destination")
        .option("format", { type: "string", alias: "f" })
        .option("markers", { type: "boolean", alias: "m" })
        .option("large-file", { type: "boolean", alias: "4" })
        .option("optimize", { type: "boolean", alias: "O" })
        .option("ipod-atom", { type: "boolean", alias: "I" })
    .group("video")            
        .option("encoder", { type: "string", alias: "e" })
        .option("x264-preset", { type: "string" })
        .option("x264-tune", { type: "string" })
        .option("encopts", { type: "string", alias: "x" })
        .option("x264-profile", { type: "string" })
        .option("quality", { type: "number", alias: "q" })
        .option("vb", { type: "number", alias: "b" })
        .option("two-pass", { type: "boolean", alias: "2" })
        .option("turbo", { type: "boolean", alias: "T" })
        .option("rate", { type: "number", alias: "r" })
        .option("vfr", { type: "boolean" })
        .option("cfr", { type: "boolean" })
        .option("pfr", { type: "boolean" })
    .group("audio")            
        .option("audio", { type: "string", alias: "a" })
        .option("aencoder", { type: "string", alias: "E" })
        .option("audio-copy-mask", { type: "string" })
        .option("audio-fallback", { type: "string" })
        .option("ab", { type: "string", alias: "B" })
        .option("aq", { type: "string", alias: "Q" })
        .option("ac", { type: "string", alias: "C" })
        .option("mixdown", { type: "string", alias: "6" })
        .option("arate", { type: "string", alias: "R" })
        .option("drc", { type: "number", alias: "D" })
        .option("gain", { type: "number" })
        .option("aname", { type: "string", alias: "A" })
    .group("picture")            
        .option("width", { type: "number", alias: "w" })
        .option("height", { type: "number", alias: "l" })
        .option("crop", { type: "string" })
        .option("loose-crop", { type: "number" })
        .option("maxHeight", { type: "number", alias: "Y" })
        .option("maxWidth", { type: "number", alias: "X" })
        .option("strict-anamorphic", { type: "boolean" })
        .option("loose-anamorphic", { type: "boolean" })
        .option("custom-anamorphic", { type: "boolean" })
        .option("display-width", { type: "number" })
        .option("keep-display-aspect", { type: "boolean" })
        .option("pixel-aspect", { type: "string" })
        .option("itu-par", { type: "boolean" })
        .option("modulus", { type: "number" })
        .option("color-matrix", { type: "string", alias: "M" })
    .group("filters")
        .option("deinterlace", { type: "string", alias: "d" })
        .option("decomb", { type: "string", alias: "5" })
        .option("detelecine", { type: "string", alias: "9" })
        .option("denoise", { type: "string", alias: "8" })
        .option("deblock", { type: "string", alias: "7" })
        .option("rotate", { type: "number" })
        .option("grayscale", { type: "boolean", alias: "g" })
    .group("subtitle")
        .option("subtitle", { type: "string", alias: "s" })
        .option("subtitle-forced", { type: "number" })
        .option("subtitle-burn", { type: "number" })
        .option("subtitle-default", { type: "number" })
        .option("native-language", { type: "string", alias: "N" })
        .option("native-dub", { type: "boolean" })
        .option("srt-file", { type: "string" })
        .option("srt-codeset", { type: "string" })
        .option("srt-offset", { type: "string" })
        .option("srt-lang", { type: "string" })
        .option("srt-default", { type: "number" })
    .group("");

exports._inject = function(dependencies){
    cp = dependencies.cp || cp;   
};
exports.HandbrakeProcess = HandbrakeProcess;

/**
A handle on the Handbrake encoding process, used to catch and respond to run-time events.
@class HandbrakeProcess
@constructor
*/
function HandbrakeProcess(){}
HandbrakeProcess.prototype = new EventEmitter();
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