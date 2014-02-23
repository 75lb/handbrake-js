"use strict";

var path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    cp = require("child_process"),
    Thing = require("nature").Thing,
    stream = require("stream");
    
/*
points to the HandbrakeCLI executable downloaded by the install script
*/
var _HandbrakeCLIPath =
    process.platform === "darwin"
        ? path.join(__dirname, "../bin/HandbrakeCLI")
        : process.platform === "win32"
            ? process.arch === "x64"
                ? path.join(__dirname, "../bin/HandbrakeCLIx64.exe")
                : path.join(__dirname, "..", "bin", "HandbrakeCLIx32.exe")
            : "HandBrakeCLI";

var progress = {
    pattern: /Encoding: task (\d) of (\d), ((.+?), )?(.*) %( \((.*?) fps, avg (.*?) fps, ETA (.*?)\))?/,
    parse: function(progressString){
        var match = progressString.match(this.pattern);
        if (match){
            this.last = {
                taskNumber: match[1],
                taskCount: match[2],
                percentComplete: match[5] || 0,
                fps: +match[7] || 0,
                avgFps: +match[8] || 0,
                eta: match[9] || 0,
                task: match[4] || "Encoding"
            };
            return this.last;
        }
    },
    last: null
};

/**
A handle on the Handbrake encoding process, used to catch and respond to run-time events.
@class HandbrakeProcess
@constructor
*/
function HandbrakeProcess(){
    var progressBuffer = "",
        self = this;

    this.allOutput = "";
    this.outputStream = new stream.PassThrough();
    
    this.infoTransform = new stream.Transform();
    this.infoTransform._transform = function(chunk, enc, done){
        var info = chunk.toString().trim();
        this.push(JSON.stringify({ info: info }));
        self.emit("output", info);
        done();
    };

    this.progressTransform = new stream.Transform();
    this.progressTransform._transform = function(chunk, enc, done){
        var chunkString = chunk.toString();
        self.allOutput += chunkString;
        progressBuffer += chunkString;
        
        var lines = progressBuffer.split("\r");
        lines.forEach(function(line){
            if (progress.pattern.test(line)){
                var progressObject = progress.parse(line);
                /**
                Fired at regular intervals passing progress information
                @event progress
                @param {Object} progress
                  @param {Number} progress.percentComplete Percentage complete
                  @param {Number} progress.fps Frames per second
                  @param {Number} progress.avgFps Average frames per second
                  @param {String} progress.eta Estimated time until completion
                  @param {String} progress.task Task description, e.g. "Encoding", "Scanning" etc.
                */
                self.emit("progress", progressObject);
                self.progressTransform.push(JSON.stringify({ progress: progressObject }));
                progressBuffer = progressBuffer.replace("\r", "").replace(progress.pattern, "");
            }
        });
        done();
    };

}
util.inherits(HandbrakeProcess, EventEmitter);

HandbrakeProcess.prototype.run = function(options){
    var self = this;
    var config = this.config = new exports.HandbrakeOptions()
        .on("error", function(err){
            self.emit("error", err);
        })
        .set(options);

    if (!config.valid){
        self.emit("invalid", config.validationMessages.toString());
        return;
    }

    /*
    Spawn HandbrakeCLI, piping both stdout and stderr to outputStream.
    While encoding (`--input` supplied) all text on stdout regards progress,
    so pipe it via the progressTransform. 
    */
    var handle = cp.spawn(_HandbrakeCLIPath, config.toArray());
    handle.stderr.pipe(this.infoTransform, { end: false });
    if (config.input){
        handle.stdout.pipe(this.progressTransform);
    } else {
        handle.stdout.pipe(this.infoTransform);
    }
    this.infoTransform.pipe(this.outputStream, { end: false });
    this.progressTransform.pipe(this.outputStream, { end: false });

    handle.on("exit", function(code, signal){
        // Handbrake was killed
        if (signal === "SIGTERM"){
            /**
            Fired if Handbrake-js was killed by CTRL-C
            @event terminated
            */
            self.emit("terminated");

        // Handbrake failed
        } else if (code && code !== 0){
            var error = "Handbrake failed, error code: " + code;

            /**
            Fired if either HandbrakeCLI crashed or ran successfully but failed to find a valid title in the input video.
            @event error
            @param {Error} error
            */
            self.emit("error", new Error(error));

        // Handbrake completed but failed to find video content
        } else if (code === 0 && /No title found\./.test(self.allOutput)){
            self.emit("error", new Error("encode failed, not a video file"));

        // Handbrake seg faulted
        } else if (code === null){
            var errorMsg = util.format(
                "msg: %s\noptions: %s\noutput: %s",
                "Handbrake crashed (Segmentation fault)",
                util.inspect(config.toJSON()),
                self.allOutput
            );
            self.emit("error", new Error(errorMsg));

        } else {
            /**
            Fired on completion of a successful encode
            @event complete
            */
            if (progress.last){
                progress.last.percentComplete = 100;
                self.emit("progress", progress.last);
                self.outputStream.push(JSON.stringify({ progress: progress.last }));
            }
            self.emit("complete");
        }
    });

    // propogate CTRL+C to Handbrake process
    var sigInt = function(){
        handle.kill();
    };
    process.on("SIGINT", sigInt);
    handle.on("exit", function(){
        process.removeListener("SIGINT", sigInt);
    });
};
exports.HandbrakeProcess = HandbrakeProcess;

/**
Runs HandbrakeCLI with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

@method exec
@param {Object | Thing | Array} options [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@param {Function} [onComplete] If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output.

@example
```js
var handbrake = require("handbrake-js");

handbrake.exec({ preset-list: true }, function(err, stdout, stderr){
    if (err) throw err;
    console.log(stdout);
});
```
*/
exports.exec = function(options, callback){
    var optionsError = null;

    var config = new exports.HandbrakeOptions()
        .on("error", function(err){
            optionsError = err;
        })
        .set(options);

    if (optionsError){
        callback(optionsError);
    } else {
        var cmd = util.format('"%s" %s', _HandbrakeCLIPath, config.toArray(true).join(" "));
        cp.exec(cmd, callback);
    }
};

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide), returning a handle on the running process.
@method spawn
@param {Object | Thing | Array} options [Options](https://trac.handbrake.fr/wiki/CLIGuide) to pass directly to HandbrakeCLI
@return {HandbrakeProcess} A handle on which you can listen for events on the Handbrake process.

@example
```js
var handbrake = require("handbrake-js");

var options = {
    input: "Eight Miles High.mov",
    output: "Eight Miles High.m4v",
    preset: "Normal"
};

handbrake.spawn(options)
    .on("error", function(err){
        console.log("ERROR: " + err.message);
    })
    .on("output", console.log);
    .on("progress", function(progress){
        console.log(progress.task + ": " + progress.percentComplete);
    })
    .on("complete", function(){
        console.log("Done!");
    });
```
*/
exports.spawn = function(options){
    var handbrakeProcess = new HandbrakeProcess();
    process.nextTick(function(){ handbrakeProcess.run(options); });
    return handbrakeProcess;
};

exports._inject = function(mock){
    cp = mock || cp;
};

/**
An options [Thing](https://github.com/75lb/nature) describing all valid Handbrake option names, types and values.
@class HandbrakeOptions
@constructor
*/
exports.HandbrakeOptions = function(){
    this.define("general", [
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
            { name: "start-at", type: "string", valueTest: /duration:|frame:|pts:/, invalidMsg: "please specify the unit, e.g. --start-at duration:10 or --start-at frame:2000" },
            { name: "stop-at", type: "string", valueTest: /duration:|frame:|pts:/, invalidMsg: "please specify the unit, e.g. --stop-at duration:100 or --stop-at frame:3000" }
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
};
util.inherits(exports.HandbrakeOptions, Thing);
