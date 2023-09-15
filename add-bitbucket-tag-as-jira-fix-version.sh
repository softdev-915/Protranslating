#!/bin/bash -e
# add-bitbucket-tag-as-jira-fix-version.sh 
# 
# By Nestor Urquiza
# Written on 06/07/2017

date

# constants
GIT_PROJECT_TMP_PATH=/tmp/lms-spa4jira

# functions
function fail() {
  echo "JIRA_USER, JIRA_PASSWORD, JIRA_BASE_URL, JIRA_PROJECT are mandatory environment variables"
  exit 1
}

function pullOrClone() {
  # Pulls or clones the repo
  (mkdir -p $GIT_PROJECT_TMP_PATH && cd $GIT_PROJECT_TMP_PATH && git pull) || (rm -fr $GIT_PROJECT_TMP_PATH && git clone git@bitbucket.org:protrans/lms-spa.git $GIT_PROJECT_TMP_PATH)
}

function run() {
  pullOrClone
  cd $GIT_PROJECT_TMP_PATH 
  last_release=`git tag | sort --version-sort | tail -1`
  last_fix_version=`curl -s -X GET $JIRA_BASE_URL/rest/api/2/project/$JIRA_PROJECT/version/?orderBy=-sequence --user $JIRA_USER:$JIRA_PASSWORD | jq -r '.values[].name' | sort --version-sort | tail -1`
  # if JIRA last fix version is older than the BitBucket last release then add the newer BitBucket version into JIRA
  if [ "$last_release" == "$last_fix_version" ]; then
    echo "Last release $last_release is already in JIRA fix version list"    
  else
    echo "Last release $last_release is different than the last fix version $last_fix_version in JIRA. Adding the tag to fix version now ..."
    curl -s -X POST -H "Content-Type: application/json" $JIRA_BASE_URL/rest/api/2/version/ --user $JIRA_USER:$JIRA_PASSWORD --data "{ \"name\": \"$last_release\", \"archived\": false, \"released\": false, \"project\": \"$JIRA_PROJECT\" }"
  fi
}

# main
if [ "$JIRA_USER" == "" ] || [ "$JIRA_PASSWORD" == "" ] || [ "$JIRA_BASE_URL" == "" ] || [ "$JIRA_PROJECT" == "" ]; then
  fail
else
  run 
fi

