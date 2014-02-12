var assert = require("assert"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    stream = require("stream"),
    Readable = stream.Readable,
    handbrake = require("../lib/handbrake");

describe("handbrake", function(){
    var mockChildProcess;

    function ChildProcess(){
        this.stdin = new Readable();
        this.stdout = new Readable();
        this.stdout._read = function(){
            this.push("test");
            this.push("null");
        }
        this.stderr = new Readable();
        this.kill = function(){
            this.emit("exit", 0, "SIGTERM");
        }
    }
    util.inherits(ChildProcess, EventEmitter);

    // function ReadableStream(){
    //     this.setEncoding = function(){};
    // }
    // util.inherits(ReadableStream, EventEmitter);

    mockChildProcess = {
        exec: function(cmd, callback){
            process.nextTick(function(){
                callback(null, "test", "test");
            });
        }
    };
    handbrake._inject(mockChildProcess);

    function getHandle(){
        var handle = new ChildProcess();
        mockChildProcess.spawn = function(){ return handle; };
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
                mockHandle.stdout.push("test data");
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
                        task: "Encoding",
                        taskNumber: 1,
                        taskCount: 1
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
        it.skip("should not warn about excess process.on listeners", function(){
            var mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            mockHandle = getHandle();
            handbrake.spawn();
            mockHandle.emit("exit", 0);

            process.nextTick(function(){
                assert.ok(!process._events.SIGINT || !process._events.SIGINT.warned);
            })
        })
    });
});
