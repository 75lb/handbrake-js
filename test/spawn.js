"use strict";
var test = require("tape"),
    handbrake = require("../lib/handbrake-js"),
    mockCp = require("./mock/child_process");

test("spawn: correct return type", function(t){
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" }, { cp: mockCp });
    t.ok(handbrakeProcess instanceof handbrake.HandbrakeProcess);
});
