var util = require("util"),
    EventEmitter = require("events").EventEmitter,
    progress = require("./progress");

module.exports = HandbrakeProcess;

/**
A thin wrapper on the handbrakeCLI child_process handle
*/
function HandbrakeProcess(handle, handbrakeOptions){
    var self = this;
    
    /** all handbrakeCLI output */
    this.allOutput = "";

    /** the options HandbrakeCLI was launched with */
    this.config = handbrakeOptions;
    
    handle.stdout.setEncoding("utf-8");
    handle.stderr.setEncoding("utf-8");
    
    handle.stdout.on("data", function(chunk){
        // console.dir(chunk);
        if (progress.pattern.test(chunk)) self._emitProgress(progress.parse(chunk));
        self.allOutput += chunk;
    });

    handle.stderr.on("data", function(chunk){
        self._emitOutput(chunk);
        self.allOutput += chunk;
    });
    
    handle.on("exit", function(code, signal){
        if (code && code !== 0){
            var error = "Handbrake failed, error code: " + code;

            /**
            Fired if either HandbrakeCLI crashed or ran successfully but failed to find a valid title in the input video.
            @event error
            @param {Error} error
            */
            self.emit("error", new Error(error));

        } else if (code === 0 && /No title found\./.test(self.allOutput)){
            self.emit("error", new Error("encode failed, not a video file"));

        } else if (code === null){
            var errorMsg = util.format(
                "msg: %s\noptions: %s\noutput: %s",
                "Handbrake crashed (Segmentation fault)",
                util.inspect(handbrakeOptions.toJSON()),
                self.allOutput
            );
            self.emit("error", new Error(errorMsg));

        } else {
            /**
            Fired on completion of a successful encode
            @event complete
            */
            var last = progress.last;
            if (last){
                last.percentComplete = 100;
                self.emit("progress", last);
            }
            self.emit("complete");
        }
    });
    
    handle.on("error", function (err){
        if (err.code === "ENOENT"){
            self.emit("error", new Error("handbrakejs spawn error: " + _HandbrakeCLIPath + " is not installed."));
        }
        else {
            self.emit("error", new Error("handbrakejs spawn error: " + err));
        }
    });
}
util.inherits(HandbrakeProcess, EventEmitter);

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
HandbrakeProcess.prototype._emitProgress = function(progress){
    this.emit("progress", progress);
};

HandbrakeProcess.prototype._emitOutput = function(output){
    this.emit("output", output);
};
