#!/usr/bin/env sh

if [ "$(uname -n)"=="ubuntu" ]
    then 
    add-apt-repository --yes ppa:stebbins/handbrake-releases
    apt-get update -qq
    apt-get install -qq handbrake-cli
fi
