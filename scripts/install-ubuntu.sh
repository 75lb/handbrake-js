#!/usr/bin/env sh

if [ "$(uname -s)"=="Linux" ]; then
  apt-get install --yes software-properties-common
  add-apt-repository --yes ppa:stebbins/handbrake-releases
  apt-get update -qq
  apt-get install -qq handbrake-cli
fi
