const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const { insertIfMissing } = require('../utils/migrations');

const invoiceSubmissionNotification = {
  name: 'invoice-submission-notification',
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
        insertIfMissing(schedulerCol, { name: invoiceSubmissionNotification.name },
          invoiceSubmissionNotification, lsp)));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
