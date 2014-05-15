"use strict";

var short = {
    pattern: /\rEncoding: task (\d) of (\d), (.+) %/,
    parse: function(progressString){
        var match = progressString.match(this.pattern);
        if (match){
            return {
                taskNumber: +match[1],
                taskCount: +match[2],
                percentComplete: +match[3],
                fps: 0,
                avgFps: 0,
                eta: "",
                task: "Encoding"
            };
        }
    }
};

var long = {
    pattern: /\rEncoding: task (\d) of (\d), (.+) % \((.+) fps, avg (.+) fps, ETA (.+)\)/,
    parse: function(progressString){
        var match = progressString.match(this.pattern);
        if (match){
            return {
                taskNumber: +match[1],
                taskCount: +match[2],
                percentComplete: +match[3],
                fps: +match[4],
                avgFps: +match[5],
                eta: match[6],
                task: "Encoding"
            };
        }
    }
};

var muxing = {
    pattern: /\rMuxing: this may take awhile.../,
    parse: function(progressString){
        var match = progressString.match(this.pattern);
        if (match){
            return {
                taskNumber: 0,
                taskCount: 0,
                percentComplete: 0,
                fps: 0,
                avgFps: 0,
                eta: "",
                task: "Muxing"
            };
        }
    }
};

exports.short = short; 
exports.long = long; 
exports.muxing = muxing; 
