const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const { insertIfMissing } = require('../utils/migrations');

const creditCardPayments = {
  name: 'credit-card-payments',
  every: '0 0 * * *',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulerCol = db.collection('schedulers');
    return lspCol.find({})
      .toArray()
      .then(lsps => Promise.mapSeries(lsps, lsp =>
        insertIfMissing(schedulerCol, { name: creditCardPayments.name }, creditCardPayments, lsp)));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
