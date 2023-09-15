#!/bin/bash -e

date

RELEASES_DIR=/opt/releases

# functions
function forceDeploy() {
  cloneRepo
  targetDirectory=$1
  lastRelease=$2
  npm install
  if [ $? -ne 0 ]; then
    # if npm install returns anything else than 0, exit with non zero code
    echo "npm install failed"
    exit -2
  fi
  # move files 
  rm -fr $targetDirectory/*
  mv node_modules $targetDirectory/
  mv app $targetDirectory/
  mv package.json $targetDirectory/
  mv process.yml $targetDirectory/
  # Put version in a json file
  echo "{\"v\" : \"$lastRelease\"}" > $targetDirectory/version.json
  # keep the deployment in the releases directory
  tar -czf $RELEASES_DIR/napi-${lastRelease}.tar.gz -C $targetDirectory .
  # but keep releases for just one month
  find $RELEASES_DIR -mindepth 1 -mtime +30 -exec rm -Rf {} \;
  # restart node
  docker-compose -f /home/ubuntu/docker-compose.yml stop lms-nodejs
  docker-compose -f /home/ubuntu/docker-compose.yml up -d lms-nodejs
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
  rm -fr backend-deploy
  git clone git@bitbucket.org:protrans/lms-spa.git backend-deploy
  cd backend-deploy 
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
