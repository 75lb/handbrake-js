#!/usr/bin/env node

var request = require("request"),
    unzip = require("unzip"),
    util = require("util"),
    exec = require("child_process").exec,
    fs = require("fs-extra"),
    path = require("path"),
    win32 = {
        url: "http://sourceforge.net/projects/handbrake/files/0.9.8/HandBrake-0.9.8-i686-Win_CLI.zip/download",
        archive: "win.zip",
        copyFrom: "unzipped/HandBrakeCLI.exe",
        copyTo: "bin/HandbrakeCLIx32.exe"
    },
    win64 = {
        url: "http://sourceforge.net/projects/handbrake/files/0.9.8/HandBrake-0.9.8-x86_64-Win_CLI.zip/download",
        archive: "win.zip",
        copyFrom: "unzipped/HandBrakeCLI.exe",
        copyTo: "bin/HandbrakeCLIx64.exe"
    },
    mac = {
        url: "http://sourceforge.net/projects/handbrake/files/0.9.8/HandBrake-0.9.8-MacOSX.6_CLI_x86_64.dmg/download",
        archive: "mac.dmg",
        copyFrom: "HandbrakeCLI", 
        copyTo: "bin/HandbrakeCLI"
    };

function mkdir(dirName){
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName);
    };
}

function downloadFile(from, to, done){
    console.log("fetching: " + from);
    var req = request(from),
        download = fs.createWriteStream(to);

    req.pipe(download);

    download.on("close", function(){
        done();
    });    
}

function extractFile(archive, copyFrom, copyTo, done){
    console.log("extracting: " + copyFrom);
    if (archive.indexOf(".zip") > 0){
        mkdir("unzipped");
        var unzipped = unzip.Extract({ path: "unzipped" });
        unzipped.on("close", function(){
            var source = fs.createReadStream(copyFrom),
                dest = fs.createWriteStream(copyTo);
            dest.on("close", function(){
                fs.remove("unzipped");
                done();
            });
            source.pipe(dest);
        });

        fs.createReadStream(archive).pipe(unzipped);

    } else if (archive.indexOf(".dmg") > 0){
        cmd = "hdiutil attach " + archive;
        exec(cmd, function(err, stdout, stderr){
            if (err) throw err;
            var match = stdout.match(/^(\/dev\/\w+)\b.*(\/Volumes\/.*)$/m);
            if (match) {
                var devicePath = match[1],
                    mountPath = match[2];
                copyFrom = path.join(mountPath, copyFrom);
                var source = fs.createReadStream(copyFrom),
                    dest = fs.createWriteStream(copyTo, { mode: 0755});
                dest.on("close", function(){
                    exec("hdiutil detach " + devicePath, function(err, out, err){
                        if (err) throw err;
                        done();
                    });
                })
                source.pipe(dest);
            }
        });
    }
}

switch(process.platform){
    case "darwin":
        go(mac);
        break;
    case "win32":
        go(process.arch == "x64" ? win64 : win32);
        break;
}

function go(install){
    downloadFile(install.url, install.archive, function(){
        mkdir("bin");
        extractFile(install.archive, install.copyFrom, install.copyTo, function(){
            console.log("HandbrakeCLI installation complete");
            fs.unlink(install.archive);
        });
    });
}
