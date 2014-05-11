"use strict";
var test = require("tape"),
    handbrake = require("../lib/handbrake"),
    mockCp = require("./mock/child_process");

test("HandbrakeProcess, start event", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("start", function(){
        t.pass();
    });

    mockCp.lastHandle.stdout.emit("data", "\rEncoding: task 1 of 1, 1.23 %");
    mockCp.lastHandle.stdout.emit("data", "\rEncoding: task 1 of 1, 3.31 %");
});

test("HandbrakeProcess, progress event: encoding (short)", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("progress", function(progress){
        t.deepEqual(progress, {
            taskNumber: 1,
            taskCount: 1,
            percentComplete: 1.23,
            fps: null,
            avgFps: null,
            eta: null,
            task: "Encoding"
        });
    });

    mockCp.lastHandle.stdout.emit("data", "\rEncoding: task 1 of 1, 1.23 %");
});

test("HandbrakeProcess, progress event: encoding (long)", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("progress", function(progress){
        t.deepEqual(progress, {
            taskNumber: 1,
            taskCount: 1,
            percentComplete: 45.46,
            fps: 105.33,
            avgFps: 106.58,
            eta: "00h00m05s",
            task: "Encoding"
        });
    });

    mockCp.lastHandle.stdout.emit("data", "\rEncoding: task 1 of 1, 45.46 % (105.33 fps, avg 106.58 fps, ETA 00h00m05s)");
});

test("HandbrakeProcess, progress event: muxing", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("progress", function(progress){
        t.deepEqual(progress, {
            taskNumber: null,
            taskCount: null,
            percentComplete: null,
            fps: null,
            avgFps: null,
            eta: null,
            task: "Muxing"
        });
    });

    mockCp.lastHandle.stdout.emit("data", "\rMuxing: this may take awhile...");
});

test("HandbrakeProcess, complete event", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("complete", function(){
        t.pass();
    });

    mockCp.lastHandle.emit("exit", 0);
});

test("HandbrakeProcess, output event (stdout)", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("output", function(output){
        t.equal(output, "clive, yeah?")
    });

    mockCp.lastHandle.stdout.emit("data", "clive, yeah?");
});

test("HandbrakeProcess, output event (stderr)", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("output", function(output){
        t.equal(output, "clive, yeah?")
    });

    mockCp.lastHandle.stderr.emit("data", "clive, yeah?");
});
