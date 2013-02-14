var assert = require("assert"),
    path = require("path"),
    EventEmitter = require("events").EventEmitter,
    Stream = require("stream"),
    sinon = require("sinon"),
    handbrake = require("../lib/handbrake");

describe("handbrake", function(){
    var mock_child_process, mockHandle;
    
    function ChildProcess(){
        this.stdin = new ReadableStream();
        this.stdout = new ReadableStream();
        this.stderr = new ReadableStream();
        this.kill = function(){
            this.emit("exit", 0, "SIGTERM");
        }
    }
    ChildProcess.prototype = new EventEmitter();

    function ReadableStream(){
        this.setEncoding = function(){};
    }
    ReadableStream.prototype = new Stream();

    mock_child_process = { 
        spawn: function(){},
        exec: function(cmd, callback){
            callback(null, "test", "test");
        }
    };
    
    handbrake._inject({
        cp: mock_child_process
    });
    
    beforeEach(function(){
        mockHandle = new ChildProcess();
        sinon.stub(mock_child_process, "spawn").returns(mockHandle);
    });
    
    afterEach(function(){
        mock_child_process.spawn.restore();
    });
    
    describe("methods:", function(){
        describe("run()", function(){

            it("run(args) should return an instance of HandbrakeProcess", function(){
                var handle = handbrake.run({
                    preset: "test"
                });

                assert.ok(handle instanceof handbrake.HandbrakeProcess);
            });
            
            it("run(args, onComplete) should call onComplete(stdout, stderr)", function(){
                var returnedStdout, returnedStderr;
                handbrake.run({ preset: "test" }, function(stdout, stderr){
                    returnedStdout = stdout;
                    returnedStderr = stderr;
                });
                
                assert.strictEqual(returnedStdout, "test");
                assert.strictEqual(returnedStderr, "test");
            });
        });
    });
    
    describe("HandbrakeProcess events: ", function(){
        
        it("should fire 'output' on ChildProcess stdout data", function(){
            handbrake.run()
                .on("output", function(data){
                    assert.strictEqual(data, "test data", data);
                });
                    
            mockHandle.stdout.emit("data", "test data");
        });

        it("should fire 'output' on ChildProcess stderr data", function(){
            handbrake.run()
                .on("output", function(data){
                    assert.strictEqual(data, "test data", data);
                });
                    
            mockHandle.stderr.emit("data", "test data");
        });

        it("should fire 'terminated' on killing ChildProcess", function(){
            var eventFired = false;

            handbrake.run()
                .on("terminated", function(){
                    eventFired = true;
                });
            mockHandle.kill();
                    
            assert.ok(eventFired);
        });

        it("should fire 'error' on ChildProcess exit with non-zero code", function(){
            var eventFired = false;

            handbrake.run()
                .on("error", function(){
                    eventFired = true;
                });
            mockHandle.emit("exit", 1);
                    
            assert.ok(eventFired);
        });

        it("should fire 'error' if ChildProcess outputs 'no title found'", function(){
            var eventFired = false;

            handbrake.run()
                .on("error", function(){
                    eventFired = true;
                });
            mockHandle.stderr.emit("data", "No title found. Ho.");
            mockHandle.emit("exit", 0);

            assert.ok(eventFired);
        });
    
        it("should fire 'success' if ChildProcess completes", function(){
            var eventFired = false;

            handbrake.run()
                .on("complete", function(){
                    eventFired = true;
                });
            mockHandle.emit("exit", 0);

            assert.ok(eventFired);
        });
        
        it("should fire 'progress' while ChildProcess encodes", function(){
            var progressData;
            
            handbrake.run()
                .on("progress", function(progress){
                    progressData = progress;
                });
            mockHandle.stdout.emit("data", "Encoding: task 1 of 1, 0.59 % (127.14 fps, avg 134.42 fps, ETA 00h13m19s)");

            assert.deepEqual(progressData, {
               percentComplete: 0.59,
               fps: 127.14,
               avgFps: 134.42,
               eta: "00h13m19s"
            });         
        });
    });    
});