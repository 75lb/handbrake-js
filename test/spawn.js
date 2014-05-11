"use strict";
var test = require("tape"),
    handbrake = require("../lib/handbrake");

test("spawn: correct return type", function(t){
    t.plan(1);
    var handbrakeProcess = handbrake.spawn({ input: "blah", output: "blah" });
    t.ok(handbrakeProcess instanceof handbrake.HandbrakeProcess);
});
