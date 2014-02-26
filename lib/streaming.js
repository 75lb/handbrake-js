"use strict";
var util = require("util"),
    stream = require("stream"),
    Transform = stream.Transform;

var OutputStream = exports.OutputStream = function(options){
    Transform.call(this, options);
    this.allOutput = [];
};
util.inherits(OutputStream, Transform);
OutputStream.prototype._transform = function(chunk, enc, done){
    this.push(chunk);
    this.allOutput.push(chunk);
    done();
};
OutputStream.prototype.getAllOutput = function(){
    return Buffer.concat(this.allOutput).toString();
};


var InfoTransform = exports.InfoTransform = function(options){
    Transform.call(this, options);
    this._buffer = "";
}
util.inherits(InfoTransform, Transform);
InfoTransform.prototype._transform = function(chunk, enc, done){
    var match,
        chunkString = chunk.toString();
    this._buffer += chunkString;

    while((match = this._buffer.match(/(.*\r?\n)|(\r.*)/)) !== null){
        var line = match[0].replace(/\r?\n/, "");
        this.push(new Buffer(JSON.stringify({ info: line }), "ascii"));
        this.emit("output", line);
        this._buffer = this._buffer.replace(match[0] ,"");
    }
    done();
};

var progress = exports.progress = {
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

var ProgressTransform = exports.ProgressTransform = function(options){
    Transform.call(this, options);
    this._buffer = "";
    this._beginOffset = null;
    this._endOffset = null;
}
util.inherits(ProgressTransform, Transform);
ProgressTransform.prototype._transform = function(chunk, enc, done){
    var chunkString = chunk.toString(),
        slices = [],
        self = this;

    this._buffer += chunkString;
    this._beginOffset = this._endOffset = null;

    for (var offset = 0; offset < this._buffer.length; offset++){
        var c = this._buffer[offset];
        if (c === "\r" || c === "\n"){
            if (this._beginOffset === null) {
                this._beginOffset = offset
            } else {
                if (offset > this._beginOffset){
                    this._endOffset = offset
                    var slice = this._buffer.slice(this._beginOffset, this._endOffset);
                    slices.push(slice)
                    var line = slice.trim();
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
                        this.emit("progress", progressObject);
                        this.push(new Buffer(JSON.stringify({ progress: progressObject }), "ascii"));
                    } else if(progress.muxing.test(line)){
                        this.emit("muxing");
                    }
                    
                    this._beginOffset = offset;
                    this._endOffset = null;
                }
            }
        }
    }

    slices.forEach(function(slice){
        self._buffer = self._buffer.replace(slice, "");
    });

    done();
};

function logFlowState(stream){
    console.log(
        "%s [%d, %d] readable: %d, writable: %d",
        stream.constructor.name,
        stream._readableState.highWaterMark,
        stream._writableState.highWaterMark,
        stream._readableState.length,
        stream._writableState.length
    );
}