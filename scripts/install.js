#!/usr/bin/env node
"use strict";
var request = require("request"),
    unzip = require("unzip"),
    exec = require("child_process").exec,
    util = require("util"),
    fs = require("fs"),
    mfs = require("more-fs"),
    path = require("path"),
    os = require("os"),
    cp = require("child_process");

var downloadPath = "http://sourceforge.net/projects/handbrake/files/0.9.9/HandBrake-0.9.9-%s/download";

var win32 = {
    url: util.format(downloadPath, "i686-Win_CLI.zip"),
    archive: "win.zip",
    copyFrom: path.join("unzipped", "HandBrakeCLI.exe"),
    copyTo: path.join("bin", "HandbrakeCLI.exe")
};
var win64 = {
    url: util.format(downloadPath, "x86_64-Win_CLI.zip"),
    archive: "win.zip",
    copyFrom: path.join("unzipped", "HandBrakeCLI.exe"),
    copyTo: "bin/HandbrakeCLI.exe"
};
var mac = {
    url: util.format(downloadPath, "MacOSX.6_CLI_x86_64.dmg"),
    archive: "mac.dmg",
    copyFrom: "HandbrakeCLI",
    copyTo: "bin/HandbrakeCLI"
};

function downloadFile(from, to, done){
    console.log("fetching: " + from);
    var req = request(from),
        download = fs.createWriteStream(to);

    req.pipe(download);

    download.on("close", done);
}

function extractFile(archive, copyFrom, copyTo, done){
    console.log("extracting: " + copyFrom);
    if (archive.indexOf(".zip") > 0){
        mfs.mkdir("unzipped");
        var unzipped = unzip.Extract({ path: "unzipped" });
        unzipped.on("close", function(){
            var source = fs.createReadStream(copyFrom),
                dest = fs.createWriteStream(copyTo);
            dest.on("close", function(){
                mfs.rmdir("unzipped");
                done();
            });
            source.pipe(dest);
        });

        fs.createReadStream(archive).pipe(unzipped);

    } else if (archive.indexOf(".dmg") > 0){
        var cmd = "hdiutil attach " + archive;
        exec(cmd, function(err, stdout){
            if (err) throw err;
            var match = stdout.match(/^(\/dev\/\w+)\b.*(\/Volumes\/.*)$/m);
            if (match) {
                var devicePath = match[1],
                    mountPath = match[2];
                copyFrom = path.join(mountPath, copyFrom);
                var source = fs.createReadStream(copyFrom),
                    dest = fs.createWriteStream(copyTo, { mode: parseInt(755, 8) });
                dest.on("close", function(){
                    exec("hdiutil detach " + devicePath, function(err){
                        if (err) throw err;
                        done();
                    });
                });
                source.pipe(dest);
            }
        });
    }
}

function install(installation){
    downloadFile(installation.url, installation.archive, function(){
        mfs.mkdir("bin");
        extractFile(installation.archive, installation.copyFrom, installation.copyTo, function(){
            console.log("HandbrakeCLI installation complete");
            fs.unlink(installation.archive);
        });
    });
}

function go(installation){
    if (fs.existsSync(path.resolve(__dirname, "..", installation.copyTo))){
        exec(installation.copyTo + " --update", function(err, stdout, stderr){
            if (err) throw err;
            if (/Your version of HandBrake is up to date/.test(stderr)){
                console.log("You already have the latest HandbrakeCLI installed");
            } else {
                install(installation);
            }
        });
    } else {
        install(installation);
    }
}

var linuxMsg =
"Linux users\n\
============\n\
handbrake-cli must be installed separately as the root user.\n\
Ubuntu users can do this using the following command:\n\
$ sudo npm run ubuntu-setup\n\
\n\
For all issues regarding installation of HandbrakeCLI on Linux, consult the Handbrake website:\n\
http://handbrake.fr";

switch(process.platform){
    case "darwin":
        go(mac);
        break;
    case "win32":
        go(process.arch === "x64" ? win64 : win32);
        break;
    case "linux":
        console.log(linuxMsg);
        break;
}
