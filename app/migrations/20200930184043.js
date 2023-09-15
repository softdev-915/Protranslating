const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db => db.db.collections().then((collections) => {
    const quoteTemplatesCol = collections.find(c => c.collectionName === 'quoteTemplates');
    const templatesCol = collections.find(c => c.collectionName === 'templates');
    if (!_.isNil(quoteTemplatesCol)) {
      return quoteTemplatesCol.find().toArray()
        .then(fuzzyMatches =>
          templatesCol.insertMany(fuzzyMatches))
        .then(() => quoteTemplatesCol.drop());
    }
  }));
if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
