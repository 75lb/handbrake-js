"use strict";
var test = require("tape"),
    handbrake = require("../lib/handbrake"),
    mock_child_process = require("./mock/child_process");

handbrake._inject(mock_child_process);

test("simple", function(t){
    t.plan(1);
    var handle = handbrake.spawn({ input: "test/video/demo.mkv", output: "tmp/demo.m4v" });

});
