"use strict";
var Handbrake = require("./Handbrake"),
    util = require("util"),
    cp = require("child_process"),
    toSpawnArgs = require("object-to-spawn-args"),
    config = require("./config");

/**
Handbrake for node.js.
@module
@typicalname hbjs
@example
```js
var hbjs = require("handbrake-js");
```
*/
exports.spawn = spawn;
exports.exec = exec;

/**
Spawns a HandbrakeCLI process with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide#options), returning an instance of `Handbrake` on which you can listen for events.

@param options {Object} - [Options](https://trac.handbrake.fr/wiki/CLIGuide#options) to pass directly to HandbrakeCLI
@returns {module:handbrake-js~Handbrake}
@alias module:handbrake-js.spawn
@example
```js
var hbjs = require("handbrake-js");

hbjs.spawn(options)
    .on("error", console.error)
    .on("output", console.log);
```
*/
function spawn(options, mocks){
    var handbrake = new Handbrake(mocks);

    /* defer so the caller can attach event listers on the returned Handbrake instance first */
    process.nextTick(function(){
        try {
            handbrake.options = options;
            handbrake._run();
        } catch (error){
            var err = new Error();
            err.message = error.message;
            err.name = "InvalidOption";
            handbrake._emitError(err);
        }
    });

    return handbrake;
}

/**
Runs HandbrakeCLI with the supplied [options](https://trac.handbrake.fr/wiki/CLIGuide#options) calling the supplied callback on completion. The exec method is best suited for short duration tasks where you can wait until completion for the output.

@param options {Object} - [Options](https://trac.handbrake.fr/wiki/CLIGuide#options) to pass directly to HandbrakeCLI
@param [onComplete] {Function} - If passed, `onComplete(err, stdout, stderr)` will be called on completion, `stdout` and `stderr` being strings containing the HandbrakeCLI output.

@example
```js
var hbjs = require("handbrake-js");

hbjs.exec({ preset-list: true }, function(err, stdout, stderr){
    if (err) throw err;
    console.log(stdout);
});
```
@alias module:handbrake-js.exec
*/
function exec(options, done){
    var cmd = util.format(
        "\"%s\" %s", 
        config.HandbrakeCLIPath, 
        toSpawnArgs(options, { quote: true }).join(" ")
    );
    cp.exec(cmd, done);
}

/**
[Command-line-args](https://github.com/75lb/command-line-args) option definitions, useful when building a CLI.
@type {array}
@ignore
*/
exports.cliOptions = [
    {
        groups: [ "handbrake", "general"],
        options: [
            { name: "help", type: Boolean, alias: "h" },
            { name: "verbose", type: Boolean, alias: "v" },
            { name: "update", type: Boolean, alias: "u" },
            {
                name: "preset", type: String, alias: "Z",
                description: "Use a built-in preset. Capitalization matters, and if the preset name has spaces, surround it with double quotation marks"
            },
            { name: "preset-list", type: Boolean, alias: "z" },
            { name: "no-dvdnav", type: Boolean },
            { name: "no-opencl", type: Boolean }
        ]
    },
    {
        groups: [ "handbrake", "source"],
        options: [
            { name: "input", type: String, alias: "i" },
            { name: "title", type: Number, alias: "t" },
            { name: "min-duration", type: Number },
            { name: "scan", type: Boolean },
            { name: "main-feature", type: Boolean },
            { name: "chapters", type: String, alias: "c" },
            { name: "angle", type: Number },
            { name: "previews", type: String },
            { name: "start-at-preview", type: String },
            { name: "start-at", type: String },
            { name: "stop-at", type: String }
        ]
    },
    {
        groups: [ "handbrake", "destination"],
        options: [
            { name: "output", type: String, alias: "o" },
            { name: "format", type: String, alias: "f" },
            { name: "markers", type: Boolean, alias: "m" },
            { name: "large-file", type: Boolean, alias: "4" },
            { name: "optimize", type: Boolean, alias: "O" },
            { name: "ipod-atom", type: Boolean, alias: "I" },
            { name: "use-opencl", type: Boolean, alias: "P" },
            { name: "use-hwd", type: Boolean, alias: "U" }
        ]
    },
    {
        groups: [ "handbrake", "video"],
        options: [
            { name: "encoder", type: String, alias: "e" },
            { name: "encoder-preset", type: String },
            { name: "encoder-preset-list", type: String },
            { name: "encoder-tune", type: String },
            { name: "encoder-tune-list", type: String },
            { name: "encopts", type: String, alias: "x" },
            { name: "encoder-profile", type: String },
            { name: "encoder-profile-list", type: String },
            { name: "encoder-level", type: String },
            { name: "encoder-level-list", type: String },
            { name: "quality", type: Number, alias: "q" },
            { name: "vb", type: Number, alias: "b" },
            { name: "two-pass", type: Boolean, alias: "2" },
            { name: "turbo", type: Boolean, alias: "T" },
            { name: "rate", type: Number, alias: "r" },
            { name: "vfr", type: Boolean },
            { name: "cfr", type: Boolean },
            { name: "pfr", type: Boolean }
        ]
    },
    {
        groups: [ "handbrake", "audio"],
        options: [
            { name: "audio", type: String, alias: "a" },
            { name: "aencoder", type: String, alias: "E" },
            { name: "audio-copy-mask", type: String },
            { name: "audio-fallback", type: String },
            { name: "ab", type: String, alias: "B" },
            { name: "aq", type: String, alias: "Q" },
            { name: "ac", type: String, alias: "C" },
            { name: "mixdown", type: String, alias: "6" },
            { name: "normalize-mix", type: String },
            { name: "arate", type: String, alias: "R" },
            { name: "drc", type: Number, alias: "D" },
            { name: "gain", type: Number },
            { name: "adither", type: String },
            { name: "aname", type: String, alias: "A" }
        ]
    },
    {
        groups: [ "handbrake", "picture"],
        options: [
            { name: "width", type: Number, alias: "w" },
            { name: "height", type: Number, alias: "l" },
            { name: "crop", type: String },
            { name: "loose-crop", type: Number },
            { name: "maxHeight", type: Number, alias: "Y" },
            { name: "maxWidth", type: Number, alias: "X" },
            { name: "strict-anamorphic", type: Boolean },
            { name: "loose-anamorphic", type: Boolean },
            { name: "custom-anamorphic", type: Boolean },
            { name: "display-width", type: Number },
            { name: "keep-display-aspect", type: Boolean },
            { name: "pixel-aspect", type: String },
            { name: "itu-par", type: Boolean },
            { name: "modulus", type: Number },
            { name: "color-matrix", type: String, alias: "M" }
        ]
    },
    {
        groups: [ "handbrake", "filters"],
        options: [
            { name: "deinterlace", type: String, alias: "d" },
            { name: "decomb", type: String, alias: "5" },
            { name: "detelecine", type: String, alias: "9" },
            { name: "denoise", type: String, alias: "8" },
            { name: "nlmeans", type: String },
            { name: "nlmeans-tune", type: String },
            { name: "deblock", type: String, alias: "7" },
            { name: "rotate", type: Number },
            { name: "grayscale", type: Boolean, alias: "g" }
        ]
    },
    {
        groups: [ "handbrake", "subtitle"],
        options: [
            { name: "subtitle", type: String, alias: "s" },
            { name: "subtitle-forced", type: Number },
            { name: "subtitle-burned", type: Number },
            { name: "subtitle-default", type: Number },
            { name: "native-language", type: String, alias: "N" },
            { name: "native-dub", type: Boolean },
            { name: "srt-file", type: String },
            { name: "srt-codeset", type: String },
            { name: "srt-offset", type: String },
            { name: "srt-lang", type: String },
            { name: "srt-default", type: Number },
            { name: "srt-burn", type: Number }
        ]
    }
];