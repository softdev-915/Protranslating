#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  COMMAND_DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
COMMAND_DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

MIGRATION_NAME=`date -u +"%Y%m%d%H%M%S"`
MIGRATION_EXT="js"
MIGRATION_DIR="app/migrations"
MIGRATION_FILE="${MIGRATION_NAME}.${MIGRATION_EXT}"
MIGRATION_PATH="${COMMAND_DIR}/${MIGRATION_DIR}/${MIGRATION_FILE}"

# Check if one argument is provided
if [ $# -ne 1 ]; then
  echo "Usage: $0 input_file"
  exit 1
fi

OLD_MIGRATION_PATH="${COMMAND_DIR}/${MIGRATION_DIR}/$1.${MIGRATION_EXT}"

# Copy the contents of the input file to the output file
cat $OLD_MIGRATION_PATH > $MIGRATION_PATH
echo -e "\033[32mMigration moved to the top: $MIGRATION_PATH\033[0m"

chmod u+x $MIGRATION_PATH

# Delete the input file
rm $OLD_MIGRATION_PATH
echo -e "\033[31mOld migration is deleted: $OLD_MIGRATION_PATH\033[0m"