const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const _ = require('lodash');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const collections = [
      'abilities',
      'catTool',
      'fuzzyMatches',
      'locations',
      'requestTypes',
    ];
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Big IP' })
      .then(bigIp =>
        Promise.mapSeries(collections, (c) => {
          const currentCol = db.collection(c);
          if (!_.isNil(currentCol)) {
            return currentCol.remove({ lspId: bigIp._id }, { multi: true });
          }
        }),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}

