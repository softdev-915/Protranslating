const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db => db.db.collections().then((collections) => {
    const fuzzyMatchesCol = collections.find(c => c.collectionName === 'fuzzyMatches');
    const breakdownsCol = collections.find(c => c.collectionName === 'breakdowns');
    if (!_.isNil(fuzzyMatchesCol)) {
      return fuzzyMatchesCol.find().toArray()
        .then(fuzzyMatches =>
          breakdownsCol.insertMany(fuzzyMatches))
        .then(() => fuzzyMatchesCol.drop());
    }
  }));
if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
