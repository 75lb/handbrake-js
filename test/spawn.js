"use strict";
var test = require("tape"),
    handbrake = require("../lib/handbrake"),
    mockCp = require("./mock/child_process");

test("spawn: correct return type", function(t){
    handbrake._inject({ cp: mockCp });
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    t.ok(handbrakeProcess instanceof handbrake.HandbrakeProcess);
});
