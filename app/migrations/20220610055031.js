const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');

    return lspCol.find({})
      .toArray()
      .then((lsps) => Promise.mapSeries(lsps, async ({ _id }) => {
        await lspCol.updateOne(
          { _id },
          {
            $set: {
              autoTranslateSettings: {
                minimumConfidenceLevel: 1, fileOutput: 'Unformatted TXT',
              },
            },
          },
        );
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
