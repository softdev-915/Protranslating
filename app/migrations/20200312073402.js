const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const { copyCollectionRecordsToLsp } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const collections = [
      'abilities',
    ];
    const lspCol = db.collection('lsp');
    const abilitiesCol = db.collection('abilities');
    return lspCol.findOne({ name: 'Big IP' }).then(bigIp => abilitiesCol.remove({ lspId: bigIp._id }, { multi: true })
      .then(() => Promise.mapSeries(collections, (c) => {
        const currentCol = db.collection(c);
        return copyCollectionRecordsToLsp(lspCol, 'Protranslating', 'Big IP', currentCol);
      })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
