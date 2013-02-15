Handbrake.js
============
A reliable, self-sufficient, cross-platform wrapper for [HandbrakeCLI](https://trac.handbrake.fr/wiki/CLIGuide) designed to enable video encoding in Node.js projects. 

Installation
============
The correct, OS-specific version of HandbrakeCLI will be downloaded and installed automatically. 

For use as a library
--------------------
Within your project directory run:

    $ npm install handbrake-js --save
    
simplistic usage example: 

    var handbrake = require("handbrake-js");
    
    handbrake.run({ 
        input: "some shitty film.wmv", 
        output: "some shitty film.m4v", 
        preset: "Normal"
    });
    
For use from the command line
-----------------------------
run:

    $ npm install -g handbrake-js

usage: 

    $ handbrake-js --input "Ballroom Bangra.avi" --output "Ballroom Bangra.mp4" --preset Normal
