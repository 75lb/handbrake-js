"use strict";
var test = require("tape"),
    cp = require("child_process"),
    fs = require("fs");

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
    try {
        fs.mkdirSync("tmp");
    } catch(err){
        // dir already exists
    }
    cp.exec("handbrake -i test/video/demo.mkv -o tmp/test.mp4 ", function(err, stdout, stderr){
        if (err) {
            t.fail(err.message);
        } else {
            t.pass();
        }
    });
});
