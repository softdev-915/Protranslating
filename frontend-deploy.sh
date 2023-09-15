#!/bin/bash -e
date

RELEASES_DIR=/opt/releases

# functions
function forceDeploy() {
  cloneRepo
  targetDirectory=$1
  lastRelease=$2
  cd frontend
  # remove node_modules for safety
  rm -rf ./node_modules
  npm install
  if [ $? -ne 0 ]; then
    # if npm install returns anything else than 0, exit with non zero code
    echo "npm install failed"
    exit -2
  fi
  npm run build
  if [ $? -ne 0 ]; then
    # if npm install returns anything else than 0, exit with non zero code
    echo "npm build failed"
    exit -3
  fi
  # Put version in a json file
  cd ./dist
  echo "{\"v\" : \"$lastRelease\"}" > ./version.json
  # copy all dist folder contents to the given folder
  rsync -av --delete ./ $targetDirectory 
  # keep the deployment in the releases directory
  tar -czf $RELEASES_DIR/fe-${lastRelease}.tar.gz -C $targetDirectory .
  # but keep releases for just one month
  find $RELEASES_DIR -mindepth 1 -mtime +30 -exec rm -Rf {} \;
}

function deployIfNeeded() {
  targetDirectory=$1
  lastRelease=$2
  versionInfo=`cat $targetDirectory/version.json || echo`
  currentRelease=$(echo $versionInfo | grep -o '[0-9\.]*')
  # deploy if the current release is different than the last release 
  if [ "$currentRelease" != "$lastRelease" ]; then
    forceDeploy $targetDirectory $lastRelease
  fi
}

function cloneRepo() {
  cd /tmp
  rm -fr frontend-deploy
  git clone git@bitbucket.org:protrans/lms-spa.git frontend-deploy
  cd frontend-deploy 
}

# main
USAGE="Usage: `basename $0` <targetDirectory>"
if [ $# -ne "1" ]; then
  echo $USAGE
  exit 1
fi

targetDirectory=$1
lastRelease=$(git ls-remote --tags git@bitbucket.org:protrans/lms-spa.git | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | sort --version-sort | tail -1)

if [ "$ENV_FORCE_DEPLOY" == "true" ]; then
  forceDeploy $targetDirectory $lastRelease
else
  deployIfNeeded $targetDirectory $lastRelease
fi
