const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const currencyCol = db.collection('currencies');
    return lspCol.find().toArray().then(lspList =>
      Promise.map((lspList), (lsp) => {
        const query = { _id: lsp._id };
        return currencyCol.findOne({ lspId: lsp._id, name: 'US Dollar' }).then((currency) => {
          if (!_.isNil(currency)) {
            const update = {
              $set: {
                currencyExchangeDetails: [{
                  base: currency._id,
                  quote: currency._id,
                  quotation: 1,
                }],
              },
            };
            return lspCol.updateOne(query, update);
          }
        });
      }),
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
