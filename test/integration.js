"use strict";
var test = require("tape"),
    cp = require("child_process"),
    fs = require("fs"),
    hbjs = require("../lib/handbrake-js");

test("cli: --preset-list", function(t){
    t.plan(1);
    cp.exec("node bin/cli.js --preset-list", function(err, stdout, stderr){
        if (err) {
            t.fail(stderr);
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
    cp.exec("node bin/cli.js -i test/video/demo.mkv -o tmp/test.mp4 ", function(err, stdout, stderr){
        if (err) {
            t.fail(stderr);
        } else {
            t.pass();
        }
    });
});

test("exec: --preset-list", function(t){
    t.plan(1);
    hbjs.exec({ "preset-list": true }, function(err, stdout, stderr){
        if (err) {
            t.fail(stderr);
        } else if (/Devices/.test(stdout)){
            t.pass();
        }
    });
});
