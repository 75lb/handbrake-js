"use strict";
var test = require("tape"),
    handbrakeJs = require("../lib/handbrake-js"),
    mockCp = require("./mock/child_process");

test("spawn: correct return type", function(t){
    t.plan(1);
    var handbrake = handbrakeJs.spawn({ input: "blah", output: "blah" }, { cp: mockCp });
    t.ok(handbrake instanceof handbrakeJs.Handbrake);
});
