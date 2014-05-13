"use strict";

/**
@namespace progress
*/
module.exports = {
    pattern: /(Encoding|Muxing): (task (\d) of (\d), ((.+?), )?(.*) %( \((.*?) fps, avg (.*?) fps, ETA (.*?)\))?)?/,
    parse: function(progressString){
        var match = progressString.match(this.pattern);
        if (match){
            this.last = {
                taskNumber: +match[3] || 0,
                taskCount: +match[4] || 0,
                percentComplete: +match[7] || 0,
                fps: +match[9] || 0,
                avgFps: +match[10] || 0,
                eta: match[11] || "",
                task: match[1] || ""
            };
            return this.last;
        }
    },
    last: null
};
