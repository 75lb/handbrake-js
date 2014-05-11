"use strict";
var test = require("tape"),
    handbrake = require("../lib/handbrake"),
    mockCp = require("./mock/child_process");

test("error handling: HandbrakeCLI not found", function(t){
    handbrake._inject({ HandbrakeCLIPath: "broken/path" });
    t.plan(1);

    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("error", function(err){
        t.deepEqual(err, {
            name: "HandbrakeCLINotFound",
            message: "HandbrakeCLI application not found",
            HandbrakeCLIPath: "broken/path",
            errno: "ENOENT",
            spawnmessage: "spawn ENOENT",
            options: { input: "blah", output: "blah" },
            output: ""
        });
    });
});

test("error handling: HandbrakeCLIError", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);

    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("error", function(err){
        t.deepEqual(err, {
            name: "HandbrakeCLIError",
            message: "Handbrake failed with error code: 13",
            errno: 13,
            options: { input: "blah", output: "blah" },
            output: ""
        });
    });

    mockCp.lastHandle.emit("exit", 13);
});

test("error handling: NoTitleFound error", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);

    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("error", function(err){
        t.deepEqual(err, {
            name: "NoTitleFound",
            message: "Encode failed, not a video file",
            options: { input: "blah", output: "blah" },
            output: "blah\nNo title found.\nblah\n"
        });
    });
    mockCp.lastHandle.stdout.emit("data", "blah\n");
    mockCp.lastHandle.stdout.emit("data", "No title found.\n");
    mockCp.lastHandle.stdout.emit("data", "blah\n");
    mockCp.lastHandle.emit("exit", 0);
});

test("error handling: SegFault", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);

    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("error", function(err){
        t.deepEqual(err, {
            name: "HandbrakeCLICrash",
            message: "HandbrakeCLI crashed (Segmentation fault)",
            options: { input: "blah", output: "blah" },
            output: ""
        });
    });
    mockCp.lastHandle.emit("exit", null);
});
