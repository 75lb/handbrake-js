"use strict";
var test = require("tape"),
    handbrake = require("../lib/handbrake"),
    mock_cp = require("./mock/child_process");

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
            spawnmessage: "spawn ENOENT"
        });
    });
});

test("error handling: HandbrakeCLIError", function(t){
    handbrake._inject({ cp: mock_cp });
    t.plan(1);

    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("error", function(err){
        t.deepEqual(err, {
            name: "HandbrakeCLIError",
            message: "Handbrake failed with error code: 13",
            errno: 13
        });
    });
    
    mock_cp.lastHandle.emit("exit", 13);
});

test("error handling: NoTitleFound error", function(t){
    handbrake._inject({ cp: mock_cp });
    t.plan(1);

    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    handbrakeProcess.on("error", function(err){
        t.deepEqual(err, {
            name: "NoTitleFound",
            message: "Encode failed, not a video file"
        });
    });
    mock_cp.lastHandle.stdout.emit("data", "blah\n");
    mock_cp.lastHandle.stdout.emit("data", "No title found.\n");
    mock_cp.lastHandle.stdout.emit("data", "blah\n");
    mock_cp.lastHandle.emit("exit", 0);
});
