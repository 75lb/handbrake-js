"use strict";
var util = require("util"),
    Model = require("nature").Model;

module.exports = HandbrakeOptions;

/**
An options [Model](https://github.com/75lb/nature) describing all valid Handbrake option names, types and values.
@class
*/
function HandbrakeOptions(){
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
}
util.inherits(HandbrakeOptions, Model);
