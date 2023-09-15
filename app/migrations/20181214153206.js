const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const addCurrencyLspId = (collection, currency, lsp) => {
  if (!currency.lspId) {
    collection.updateOne({
      _id: currency._id,
      lspId: {
        $exists: false,
      },
    },
    {
      $set:
        {
          lspId: lsp._id,
        },
    },
    );
  }
  return Promise.resolve();
};

const addMissingCurrency = (collection, currency, lsp) => {
  currency.lspId = lsp._id;
  return collection.findOne({
    name: currency.name,
    lspId: lsp._id,
  }).then((currencyFound) => {
    if (!currencyFound) {
      delete currency._id;
      return collection.insertOne(currency);
    }
    return Promise.resolve();
  });
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const currenciesCol = db.collection('currencies');
    let lspList;
    // Get all LSP
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        lspList = lsps;
        // Get all currencies
        return currenciesCol.find().toArray();
      }).then((currencies) => {
        if (lspList.length > 0) {
          const ptsLsp = lspList.find(lsp => lsp.name === 'Protranslating');
          const ptiLsp = lspList.find(lsp => lsp.name === 'PTI');
          // Iterate and add (if not found) each currency for both lsp
          const upsertPromises = [];
          if (currencies.length > 0) {
            currencies.forEach((currency) => {
              upsertPromises.push(() => addCurrencyLspId(currenciesCol, currency, ptsLsp));
              upsertPromises.push(() => addMissingCurrency(currenciesCol, currency, ptiLsp));
            });
            return Promise.mapSeries(upsertPromises, upsertPromise => upsertPromise());
          }
        }
        return Promise.resolve();
      });
  });
if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
