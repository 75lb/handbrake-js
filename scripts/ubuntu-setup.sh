#!/usr/bin/env sh

UpdateInstall () {
    apt-get update -qq
    apt-get install -qq handbrake-cli
}

InstallFromRepository () {
    echo "Attempting to install handbrake from " $1
    add-apt-repository --yes $1
    UpdateInstall
}

HandBrakeFoundInPath () {
  command -v HandBrakeCLI 2>&1 >/dev/null  
  ret=$?
  return $ret
}

if [ "$(uname -n)"=="ubuntu" ]
    then 

  # Try to install from whatever is already in packages
  UpdateInstall

  # Try to install from releases
  HandBrakeFoundInPath || InstallFromRepository ppa:stebbins/handbrake-releases

  # Try to install from snapshots
  HandBrakeFoundInPath || InstallFromRepository ppa:stebbins/handbrake-snapshots
fi

InstallPath=bin/HandbrakeCLI.exe
# If the command exists, lets' provide the expected local link.
if [ HandBrakeFoundInPath ]; 
then
  if [ ! -e $InstallPath ]; then
    ln -sf `command -v HandBrakeCLI` $InstallPath
  fi
else 
  echo "Unable to locate HandBrakeCLI in path."
  exit 1
fi

# If the executable local link exists, we consider the install successful.
if [ -x $InstallPath ]; 
then
  echo "HandBrakeCLI successfully installed."
  exit 0
else
  echo "HandBrakeCLI was not successfully installed."
  exit 2
fi
