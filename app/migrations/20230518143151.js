const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const CHATGPT_PROVIDER = 'ChatGPT';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const lspCol = db.collection('lsp');
    const mtEnginesCol = db.collection('mtProviders');
    const lsps = await lspCol.find().toArray();
    await Promise.mapSeries(lsps, lsp =>
      mtEnginesCol.update({
        lspId: lsp._id,
        name: CHATGPT_PROVIDER,
      }, {
        $set: {
          name: CHATGPT_PROVIDER,
        },
      }, {
        upsert: true,
      }),
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
