
const mongo = require('../components/database/mongo');
const _ = require('lodash');
const Promise = require('bluebird');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const companiesCol = db.collection('companies');
    const currenciesCol = db.collection('currencies');
    const lspCol = db.collection('lsp');
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then(lsps =>
        Promise.map((lsps), lsp =>
          currenciesCol.findOne({ name: 'US Dollar', lspId: lsp._id }).then((usdCurrency) => {
            const quoteCurrency = _.pick(usdCurrency, ['_id', 'name', 'isoCode']);
            const update = {
              $set: {
                'billingInformation.quoteCurrency': quoteCurrency,
              },
            };
            const options = {
              upsert: false,
              multi: true,
            };
            return companiesCol.updateMany({ lspId: lsp._id }, update, options);
          }),
        ),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
