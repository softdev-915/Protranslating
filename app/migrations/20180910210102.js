const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
// Currencies populated from ISO 4217
const { currencies } = require('./data/20180910210102/currencies.json');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const currencyCollection = db.collection('currencies');
    return Promise.map(currencies, c => currencyCollection
      .update({
        name: c.name,
        isoCode: c.isoCode,
      }, { $set: {
        name: c.name,
        isoCode: c.isoCode,
      } }, {
        upsert: true,
      }), { concurrency: 1 });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
