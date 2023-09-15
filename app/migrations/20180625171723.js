const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db => db.db.collections().then((collections) => {
    const col = collections.find(c => c.collectionName === 'externalResource');
    if (col) {
      return db.dropCollection('externalResource');
    }
  }));

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
