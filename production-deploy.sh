#!/bin/bash -e
# production-deploy.sh

date

USAGE="Usage: `basename $0` <version> <fe_target> <napi_target>"

version=$1
fe_release_file=fe-${version}.tar.gz
napi_release_file=napi-${version}.tar.gz
fe_target=$2
napi_target=$3

if [ $# -ne "3" ] 
then
  echo $USAGE
  exit 1 
fi

cd
mkdir -p $fe_target
mkdir -p $napi_target
scp -i lms-test.pem ubuntu@lms-test.protranslating.com:/opt/releases/$fe_release_file /tmp/
scp -i lms-test.pem ubuntu@lms-test.protranslating.com:/opt/releases/$napi_release_file /tmp/
cd $fe_target
rm -fr *
tar xvf /tmp/$fe_release_file
cd $napi_target
rm -fr *
tar xvf /tmp/$napi_release_file
docker-compose -f /home/ubuntu/docker-compose.yml stop lms-nodejs
docker-compose -f /home/ubuntu/docker-compose.yml up -d lms-nodejs
