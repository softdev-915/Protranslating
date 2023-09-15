const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const GOOGLE_MT_PROVIDER = 'Google MT';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const mtProviderCol = db.collection('mtProviders');
    return lspCol.find({
      $or: [{
        name: 'Protranslating',
      }, {
        name: 'PTI',
      }, {
        name: 'BIG IP',
      }],
    }).toArray()
      .then(lsps =>
        Promise.mapSeries(lsps, lsp =>
          mtProviderCol.update({
            lspId: lsp._id,
            name: GOOGLE_MT_PROVIDER,
          }, {
            $set: {
              name: GOOGLE_MT_PROVIDER,
            },
          }, {
            upsert: true,
          }),
        ),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
