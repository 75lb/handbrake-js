"use strict";
var test = require("tape"),
    cp = require("child_process");

// also travis should test installation script

test("cli: no args", function(t){
    t.plan(1);
    cp.exec("handbrake", function(err, stdout, stderr){
        // console.dir(err)
        if (err) {
            t.fail(err.message);
        } else {
            t.pass();
        }
    });
});

test("cli: simple encode", function(t){
    t.plan(1);
    cp.exec("mkdir tmp; handbrake -i test/video/demo.mkv -o tmp/test.mp4 ", function(err, stdout, stderr){
        if (err) {
            t.fail(err.message);
        } else {
            t.pass();
        }
    });
});
