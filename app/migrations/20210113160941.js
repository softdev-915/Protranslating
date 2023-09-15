const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const { insertIfMissing } = require('../utils/migrations');

const billInvoicePerPeriod = {
  name: 'bill-invoice-per-period',
  every: '0 0 * * *',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};
const billFlatRate = {
  name: 'bill-flat-rate',
  every: '0 0 * * *',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};

const billVariableRate = {
  name: 'bill-variable-rate',
  every: '0 0 * * *',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};
const schedulersToAdd = [billInvoicePerPeriod, billFlatRate, billVariableRate];
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    const schedulerCol = db.collection('schedulers');
    return lsp.find({}).toArray().then(lsps =>
      Promise.mapSeries(lsps, lspItem => Promise.mapSeries(schedulersToAdd, schedulerToAdd =>
        insertIfMissing(schedulerCol, {
          name: schedulerToAdd.name,
        }, schedulerToAdd, lspItem))));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
