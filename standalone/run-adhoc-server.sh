#!/bin/bash
# Searches for an available free port
# Warning, it will trigger a race condition if this script
# is running in parallel
function next-available-port {
  FIRST_PORT=1200
  LAST_PORT=65000
  for PORT in $(seq $FIRST_PORT $LAST_PORT)
  do
    echo -ne "\035" | telnet 127.0.0.1 $PORT > /dev/null 2>&1;
    if [ $? -eq 1 ]
    then
      echo $PORT;
      break;
    fi
  done
}

# Given a PID, checks if a process exists
function process_exist {
  kill -0 $1
}

# Removes all files created for the standalone server created
function clean-files-and-processes {
  echo "Cleaning up processes and files"
  if [ -n "$FRONTEND_PID" ] && [ -n $(process_exist $FRONTEND_PID) ]
  then
    echo "Killing frontend with PID: $FRONTEND_PID"
    kill $FRONTEND_PID
  fi
  if [ -n "$SERVER_PID" ] && [ -n $(process_exist $SERVER_PID) ]
  then
    echo "Killing server with PID: $SERVER_PID"
    kill $SERVER_PID
  fi
  if [ -n "$MONGOD_PID" ] && [ -n $(process_exist $MONGOD_PID) ]
  then
    echo "Killing mongo with PID: $MONGOD_PID"
    kill $MONGOD_PID
  fi
  echo "Removing instance files in $INSTANCE_DIR"
  rm -rf $INSTANCE_DIR
  echo "Done!"
  exit 0
}

# Returns the absolute path of a path
function relative-to-absolute-path {
  [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

CURL=$(command -v curl)
WGET=$(command -v wget)
TELNET=$(command -v telnet)

if [ -z "$TELNET" ]
then
  echo "Missing telnet command"
  exit 1
fi

FULL_SCRIPT_PATH=$(relative-to-absolute-path "$0")
if [ -n "$1" ]
then
  LMS_E2E_FOLDER=$(relative-to-absolute-path "$1")
  if [ ! -d "$LMS_E2E_FOLDER" ]
  then
    echo "The lms-e2e folder '$LMS_E2E_FOLDER' does not exist"
    exit 1
  fi
  if [ ! -f $LMS_E2E_FOLDER/start.js ]; then
    echo "The lms-e2e folder '$LMS_E2E_FOLDER' doesn't seem to be the right one. Missing start.js file"
    exit 1
  fi
fi
DIR=$(dirname "$FULL_SCRIPT_PATH")
MONGO_PORT=$(next-available-port)
INSTANCE_DIR=$DIR/mongod-$MONGO_PORT
FRONTEND_DIR=$DIR/../frontend
GENCERT=$INSTANCE_DIR/keys/certs/gencert.sh
# trap ctrl-c and call ctrl_c()
trap clean-files-and-processes INT
rm -rf $INSTANCE_DIR
mkdir $INSTANCE_DIR
mkdir $INSTANCE_DIR/mongo
mkdir $INSTANCE_DIR/backups
mkdir $INSTANCE_DIR/uploads
mkdir $INSTANCE_DIR/downloads
mkdir $INSTANCE_DIR/keys
mkdir $INSTANCE_DIR/keys/certs
mkdir $INSTANCE_DIR/logs
mkdir $INSTANCE_DIR/eop
mkdir $INSTANCE_DIR/eop/output
mkdir $INSTANCE_DIR/eop/keys
mkdir $INSTANCE_DIR/e2e
mkdir $INSTANCE_DIR/e2e/conf
mkdir $INSTANCE_DIR/e2e/temp
mkdir $INSTANCE_DIR/e2e/ss
mkdir $INSTANCE_DIR/e2e/downloads

# Download the cert generator
if [ -n "$CURL" ]
then
  curl -o $GENCERT https://raw.githubusercontent.com/nestoru/pob-recipes/master/common/tools/gencert.sh
elif [ -n "$WGET" ]
then
  wget -O $GENCERT https://raw.githubusercontent.com/nestoru/pob-recipes/master/common/tools/gencert.sh
else
  echo "You need either curl or wget installed in order to execute this command"
  exit 1
fi
if [ $? -ne 0 ]
then
  echo "Failed to download the gencert.sh. Cannot continue, cleaning directory $INSTANCE_DIR"
  rm -rf $INSTANCE_DIR
  exit 1
fi
chmod +x $GENCERT
cd $INSTANCE_DIR/keys/certs
./gencert.sh US FL Miami app app app app@sample.com
cp app.crt ./chain.crt
cat app.key app.crt > ./app.pem
cp app.crt ./ca.crt
cd ../../../

echo "Starting mongo on port $MONGO_PORT"
# spin up a mongod
# in memory storage is only supported in mongo-enterprise
# mongod --storageEngine inMemory --inMemorySizeGB 0.2 --dbpath $DIR/mongod-$MONGO_PORT --port $MONGO_PORT
mongod --storageEngine wiredTiger --dbpath $INSTANCE_DIR/mongo --port $MONGO_PORT > /dev/null 2>&1 &
MONGOD_PID=$!

echo "Waiting for mongodb to startup"
sleep 2
# check if the available port is the same as the mongo port, if it is it means
# that the mongo server is not up still
BACKEND_PORT=$(next-available-port)
while [ "$BACKEND_PORT" == "$MONGO_PORT" ]; do
   BACKEND_PORT=$(next-available-port)
   sleep 1
done
echo "Starting backend server on port $BACKEND_PORT"
# Load env var and override its values if they don't exist
source $DIR/env.sh
node $DIR/../app/lms.js > /dev/null 2>&1 &
SERVER_PID=$!

echo "Waiting for backend to startup"
sleep 5
# check if the available port is the same as the backend port, if it is it means
# that the backend server is not up still
FRONTEND_PORT=$(next-available-port)
while [ "$FRONTEND_PORT" == "$BACKEND_PORT" ]; do
   FRONTEND_PORT=$(next-available-port)
   sleep 1
done

echo "Starting frontend on port $FRONTEND_PORT"

LMS_E2E_FRONTEND_PORT=$FRONTEND_PORT LMS_E2E_BACKEND_PORT=$BACKEND_PORT npm --prefix $FRONTEND_DIR run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

#Make a warmup request to trigger token issue for one login and avoid race condition
echo "Warming up server"
URL=https://127.0.0.1:$BACKEND_PORT/api/auth
STATUS_CODE=0
while [ $STATUS_CODE -gt 299 ] || [ $STATUS_CODE -lt 200 ]; do
  if [ -n "$CURL" ]
  then
    STATUS_CODE=`curl -k $URL \
-H 'Accept-Encoding: gzip, deflate, br' \
-H 'Content-Type: application/json;charset=UTF-8' \
-H 'Accept: application/json, text/plain, */*' \
--data-binary '{"email":"e2e@sample.com","password":"Welcome123"}' \
--compressed \
-o /dev/null \
-w "%{http_code}"`
  elif [ -n "$WGET" ]
  then
    STATUS_CODE=`wget $URL -S --post-data='{"email":"e2e@sample.com","password":"Welcome123"}' \
--header='Accept-Encoding: gzip, deflate, br' \
--header='Content-Type: application/json;charset=UTF-8' \
--header='Accept: application/json, text/plain, */*' \
--no-check-certificate 2>&1 | grep "HTTP/" | awk '{print $2}'`
  else
    echo "You need either curl or wget installed in order to execute this command"
    exit 1
  fi
  sleep 3
done

echo "Served was warmed up and returned status code: $STATUS_CODE"

# Wait for frontend server to load
echo "Waiting for frontend server"
URL=http://127.0.0.1:$FRONTEND_PORT/
STATUS_CODE=0
while [ $STATUS_CODE -gt 299 ] || [ $STATUS_CODE -lt 200 ]; do
  if [ -n "$CURL" ]
  then
    STATUS_CODE=`curl -k $URL -o /dev/null -w "%{http_code}"`
  elif [ -n "$WGET" ]
  then
    STATUS_CODE=`wget $URL -S --no-check-certificate 2>&1 | grep "HTTP/" | awk '{print $2}'`
  else
    echo "You need either curl or wget installed in order to execute this command"
    exit 1
  fi
  sleep 3
done

echo "Frontend server is ready"
echo "All systems GO"

# if lms folder given start e2e suite
if [ -n "$LMS_E2E_FOLDER" ]
then
  echo "Starting e2e located in $LMS_E2E_FOLDER"
  if [ -z "$E2E_BROWSER" ]
  then
    echo "No browser specified, I'm going to choose chrome for you"
    E2E_BROWSER="chrome"
  fi
  if [ -z "$E2E_TAGS" ]
  then
    echo "No tags specified, I'm going to choose all for you"
    E2E_TAGS="all"
  fi
  E2E_PARALLEL_MAX=$E2E_PARALLEL_MAX \
  APP_URL="http://127.0.0.1:$FRONTEND_PORT/" \
  E2E_USER='e2e@sample.com' \
  E2E_PASS='Welcome123' \
  E2E_OUT_FOLDER=$INSTANCE_DIR/e2e \
  E2E_TAGS=$E2E_TAGS \
  E2E_BROWSER=$E2E_BROWSER \
  npm --prefix $LMS_E2E_FOLDER run e2e &
  E2E_PID=$!
  wait $E2E_PID
  echo "E2E suite finished"
fi

wait $MONGOD_PID
# end script by killing al processes and removing all created files
clean-files-and-processes
