const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const SI_CONNECTOR = {
  name: 'Sage Intacct',
  syncFromDate: new Date('2020-09-01T19:00:00.000Z'),
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const connectors = db.collection('connectors');
    return lspCol.find({}).toArray()
      .then(lsps =>
        Promise.each(lsps, lsp =>
          connectors.updateOne(
            { name: SI_CONNECTOR.name, lspId: lsp._id },
            { $set: { ...SI_CONNECTOR, lspId: lsp._id } },
            { upsert: true },
          )),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
