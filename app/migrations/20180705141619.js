const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

// This migration fixes migration 20170515110810, changing catTool and
// languageCombination from 0/1 to true/false

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const abilitiesCollection = db.collection('abilities');
    const operations = [{ query: { catTool: 0 }, edition: { catTool: false } },
      { query: { catTool: 1 }, edition: { catTool: true } },
      { query: { languageCombination: 0 }, edition: { languageCombination: false } },
      { query: { languageCombination: 1 }, edition: { languageCombination: true } },
    ];
    return Promise.mapSeries(operations, op => abilitiesCollection
      .update(op.query, { $set: op.edition }, { multi: true }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
