var assert = require("assert"),
    path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Stream = require("stream").Duplex,
    handbrake = require("../lib/handbrake");

function l(msg){
    console.log.apply(null, Array.prototype.slice.call(arguments));
}

describe("handbrake", function(){
    var mock_child_process;
    
    function ChildProcess(){
        this.stdin = new ReadableStream();
        this.stdout = new ReadableStream();
        this.stderr = new ReadableStream();
        this.kill = function(){
            this.emit("exit", 0, "SIGTERM");
        }
    }
    util.inherits(ChildProcess, EventEmitter);

    function ReadableStream(){
        this.setEncoding = function(){};
    }
    util.inherits(ReadableStream, EventEmitter);
    
    mock_child_process = { 
        exec: function(cmd, callback){
            process.nextTick(function(){
                callback(null, "test", "test");
            });
        }
    };
    handbrake._inject(mock_child_process);

    function getHandle(){
        var handle = new ChildProcess();
        mock_child_process.spawn = function(){ return handle; };
        return handle;
    }
    
    describe("methods:", function(){
        describe("run()", function(){

            it("run(args) should return an instance of HandbrakeProcess", function(){
                var mockHandle = getHandle();
                var handle = handbrake.run({ preset: "test" });

                assert.ok(handle instanceof handbrake.HandbrakeProcess);
                mockHandle.emit("exit", 0);
            });
            
            it("run(args, onComplete) should call onComplete(stdout, stderr) async", function(done){
                handbrake.run({ preset: "test" }, function(stdout, stderr){
                    assert.strictEqual(stdout, "test");
                    assert.strictEqual(stderr, "test");
                    done();
                });                
            });
        });
    });
    
    describe("HandbrakeProcess events: ", function(){
        
        it("should emit 'output' on ChildProcess stdout 'data'", function(){
            var mockHandle = getHandle();
            var dataReceived = "";
            handbrake.run()
                .on("output", function(data){
                    dataReceived = data; 
                });
                    
            mockHandle.stdout.emit("data", "test data");
            assert.strictEqual(dataReceived, "test data");
            mockHandle.emit("exit", 0);
        });

        it("should emit 'output' on ChildProcess stderr 'data'", function(){
            var mockHandle = getHandle();
            var dataReceived = "";
            handbrake.run()
                .on("output", function(data){
                    dataReceived = data; 
                });
                    
            mockHandle.stderr.emit("data", "test data");
            assert.strictEqual(dataReceived, "test data");
            mockHandle.emit("exit", 0);
        });

        it("should fire 'terminated' on killing ChildProcess", function(){
            var mockHandle = getHandle();
            var eventFired = false;

            handbrake.run()
                .on("terminated", function(){
                    eventFired = true;
                });
            mockHandle.kill();
                    
            assert.ok(eventFired);
        });

        it("should fire 'error' on ChildProcess exit with non-zero code", function(){
            var mockHandle = getHandle();
            var eventFired = false;

            var handle = handbrake.run();
            handle.on("error", function(){
                eventFired = true;
            });
            mockHandle.emit("exit", 1);
                    
            assert.ok(eventFired);
        });

        it("should fire 'error' if ChildProcess outputs 'no title found'", function(){
            var mockHandle = getHandle();
            var eventFired = false;

            handbrake.run()
                .on("error", function(){
                    eventFired = true;
                });
            mockHandle.stderr.emit("data", "No title found. Ho.");
            mockHandle.emit("exit", 0);

            assert.ok(eventFired);
        });
    
        it("should fire 'complete' if ChildProcess completes", function(){
            var mockHandle = getHandle();
            var eventFired = false;

            handbrake.run()
                .on("complete", function(){
                    eventFired = true;
                });
            mockHandle.emit("exit", 0);

            assert.ok(eventFired);
        });
        
        it("should fire ('progress', progress) as ChildProcess encodes", function(){
            var mockHandle = getHandle();
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
            mockHandle.emit("exit", 0);
        });
    });    
    
    describe("regressions", function(){
        it("should not warn about excess process.on listeners", function(){
            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.run();
            mockHandle.emit("exit", 0);
            
            assert.ok(!process._events.SIGINT || !process._events.SIGINT.warned);
        })
    });
});
