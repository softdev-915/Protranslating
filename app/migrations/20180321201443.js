const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const COLLECTION_NAME = 'lms_clusters';
let db;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((database) => {
    db = database;
    // check if lms_cluster exists
    return database.db.listCollections({ name: COLLECTION_NAME })
      .next();
  }).then((colInfo) => {
    // remove if exists
    if (colInfo && colInfo.name && colInfo.name === COLLECTION_NAME) {
      return db.collection(COLLECTION_NAME).drop();
    }
    return true;
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
