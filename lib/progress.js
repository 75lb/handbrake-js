module.exports = {
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
    last: null,
    muxing: /Muxing:/
};
