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
        describe("spawn()", function(){
            it("spawn(args) should return an instance of HandbrakeProcess", function(){
                var mockHandle = getHandle();
                var handle = handbrake.spawn({ preset: "test" });

                assert.ok(handle instanceof handbrake.HandbrakeProcess);
                mockHandle.emit("exit", 0);
            });
        });
        describe("exec()", function(){
            it("exec(args, callback) should call callback(err, stdout, stderr) async", function(done){
                handbrake.exec({ preset: "test" }, function(err, stdout, stderr){
                    assert.strictEqual(stdout, "test");
                    assert.strictEqual(stderr, "test");
                    done();
                });
            });
        });
    });
    
    describe("HandbrakeProcess events: ", function(){
        
        it("should emit 'output' on ChildProcess stdout 'data'", function(done){
            var mockHandle = getHandle();
            handbrake.spawn()
                .on("output", function(data){
                    assert.strictEqual(data, "test data");
                    done();
                });
            
            process.nextTick(function(){
                mockHandle.stdout.emit("data", "test data");
                mockHandle.emit("exit", 0);
            });
        });

        it("should emit 'output' on ChildProcess stderr 'data'", function(done){
            var mockHandle = getHandle();
            handbrake.spawn()
                .on("output", function(data){
                    assert.strictEqual(data, "test data");
                    done();
                });
        
            process.nextTick(function(){
                mockHandle.stderr.emit("data", "test data");
                mockHandle.emit("exit", 0);
            });
        });

        it("should fire 'terminated' on killing ChildProcess", function(done){
            var mockHandle = getHandle();

            handbrake.spawn()
                .on("terminated", function(){
                    assert.ok(true);
                    done();
                });
            process.nextTick(function(){
                mockHandle.kill();
            });
        });

        it("should fire 'error' on ChildProcess exit with non-zero code", function(done){
            var mockHandle = getHandle();
            handbrake.spawn()
                .on("error", function(){
                    assert.ok(true);
                    done();
                });
            process.nextTick(function(){
                mockHandle.emit("exit", 1);
            });
        });

        it("should fire 'error' if ChildProcess outputs 'no title found'", function(done){
            var mockHandle = getHandle();
            handbrake.spawn()
                .on("error", function(){
                    assert.ok(true);
                    done();
                });

            process.nextTick(function(){
                mockHandle.stderr.emit("data", "No title found. Ho.");
                mockHandle.emit("exit", 0);
            });
        });
    
        it("should fire 'complete' if ChildProcess completes", function(done){
            var mockHandle = getHandle();
            handbrake.spawn()
                .on("complete", function(){
                    assert.ok(true);
                    done();
                });

            process.nextTick(function(){
                mockHandle.emit("exit", 0);
            });
        });
        
        it("should fire ('progress', progress) as ChildProcess encodes", function(done){
            var mockHandle = getHandle();
            handbrake.spawn()
                .on("progress", function(progress){
                    assert.deepEqual(progress, {
                       percentComplete: 0.59,
                       fps: 127.14,
                       avgFps: 134.42,
                       eta: "00h13m19s",
                       task: "Encoding"
                    });
                    done();
                });
            process.nextTick(function(){
                mockHandle.stdout.emit("data", "Encoding: task 1 of 1, 0.59 % (127.14 fps, avg 134.42 fps, ETA 00h13m19s)");
                mockHandle.emit("exit", 0);
            });
        });
    });    
    
    describe("regressions", function(){
        it("should not warn about excess process.on listeners", function(){
            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);
            
            assert.ok(!process._events.SIGINT || !process._events.SIGINT.warned);
        })
    });
});
