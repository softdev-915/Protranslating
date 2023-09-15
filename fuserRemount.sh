#!/bin/bash -x
# fuserRemount.sh
# 
# @author Nestor Urquiza
# @description: Deletes the pod to remount the fuse unmounted gcs bucket
#
 
USAGE="Usage: `basename $0` <environment [test|prod]>"

#Main
if [ $# -lt "1" ] 
then
  echo $USAGE
  exit 1 
fi

environment=$1
kubectlCmd="kubectl --context=gke_pts-lms-${environment}_us-east1-b_lms-${environment}-cluster"
for line in $($kubectlCmd get pods | \
  grep nodejs | awk '{print $1}'); \
  do echo $line; ($kubectlCmd exec -ti $line \
    -- ls /pts-lms-${environment}-files || \
    $kubectlCmd delete pod $line); done
