"use strict";
var test = require("tape"),
    handbrakeJs = require("../lib/handbrake-js"),
    mockCp = require("./mock/child_process");

test("validation: input === output", function(t){
    t.plan(1);

    handbrakeJs.spawn({ input: "blah", output: "blah" }, { cp: mockCp })
        .on("error", function(err){
            t.deepEqual(err, {
                name: "ValidationError",
                message: "input and output paths are the same",
                options: { input: "blah", output: "blah" },
                output: ""
            });
        });
});
