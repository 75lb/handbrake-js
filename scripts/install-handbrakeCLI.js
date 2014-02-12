#!/usr/bin/env node

var request = require("request"),
    unzip = require("unzip"),
    exec = require("child_process").exec,
    fs = require("fs-extra"),
    path = require("path"),
    win32 = {
        url: "http://sourceforge.net/projects/handbrake/files/0.9.9/HandBrake-0.9.9-i686-Win_CLI.zip/download",
        archive: "win.zip",
        copyFrom: path.join("unzipped", "HandBrakeCLI.exe"),
        copyTo: path.join("bin", "HandbrakeCLIx32.exe")
    },
    win64 = {
        url: "http://sourceforge.net/projects/handbrake/files/0.9.9/HandBrake-0.9.9-x86_64-Win_CLI.zip/download",
        archive: "win.zip",
        copyFrom: path.join("unzipped", "HandBrakeCLI.exe"),
        copyTo: "bin/HandbrakeCLIx64.exe"
    },
    mac = {
        url:"http://sourceforge.net/projects/handbrake/files/0.9.9/HandBrake-0.9.9-MacOSX.6_CLI_x86_64.dmg/download",
        archive: "mac.dmg",
        copyFrom: "HandbrakeCLI", 
        copyTo: "bin/HandbrakeCLI"
    };

function mkdir(dirName){
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName);
    }
}

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
        var cmd = "hdiutil attach " + archive;
        exec(cmd, function(err, stdout){
            if (err) throw err;
            var match = stdout.match(/^(\/dev\/\w+)\b.*(\/Volumes\/.*)$/m);
            if (match) {
                var devicePath = match[1],
                    mountPath = match[2];
                copyFrom = path.join(mountPath, copyFrom);
                var source = fs.createReadStream(copyFrom),
                    dest = fs.createWriteStream(copyTo, { mode: 0755 });
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
        mkdir("bin");
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

switch(process.platform){
    case "darwin":
        go(mac);
        break;
    case "win32":
        go(process.arch === "x64" ? win64 : win32);
        break;
}
