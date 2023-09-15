#!/bin/bash -e

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

cat > $MIGRATION_PATH <<- EOM
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
EOM

chmod u+x $MIGRATION_PATH

echo "Created new migration file in $MIGRATION_PATH"
