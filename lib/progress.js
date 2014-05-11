"use strict";

module.exports = {
    pattern: /(Encoding|Muxing): (task (\d) of (\d), ((.+?), )?(.*) %( \((.*?) fps, avg (.*?) fps, ETA (.*?)\))?)?/,
    parse: function(progressString){
        var match = progressString.match(this.pattern);
        if (match){
            this.last = {
                taskNumber: +match[3] || null,
                taskCount: +match[4] || null,
                percentComplete: +match[7] || null,
                fps: +match[9] || null,
                avgFps: +match[10] || null,
                eta: match[11] || null,
                task: match[1] || null
            };
            return this.last;
        }
    },
    last: null
};
