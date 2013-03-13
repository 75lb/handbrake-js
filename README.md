Handbrake.js
============
A reliable, self-sufficient, cross-platform wrapper for [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide) designed to enable video encoding in Node.js projects. 

HandbrakeCLI installation
-------------------------
The correct version of HandbrakeCLI for your platform will be downloaded and installed automatically on installation, except for Ubuntu users who should run 

    $ sudo npm -g run-script veelo ubuntu-setup

Use as a library
--------------------
**Installation** 

Within your project directory run:

    $ npm install handbrake-js --save

**Usage**

There are two ways to invoke `run`. Method one involves listening for events: 

    var handbrake = require("handbrake-js");
    
    var options = {
        input: "Eight Miles High.mov",
        output: "Eight Miles High.m4v",
        preset: "Normal"
    };
    
    handbrakeCLI.run(options)
        .on("output", console.log);
        .on("progress", function(encode){
            console.log(encode.percentComplete);
        })
        .on("complete", function(){ 
            console.log("Encode complete"); 
        });

The second method is to pass an `onComplete` callback. It's more convenient for short duration tasks: 

    handbrake.run({ preset-list: true }, function(stdout, stderr){
        console.log(stdout);
    });
    
For use from the command line
-----------------------------
run:

    $ npm install -g handbrake-js

usage: 

    $ handbrake-js --input "Ballroom Bangra.avi" --output "Ballroom Bangra.mp4" --preset Normal
