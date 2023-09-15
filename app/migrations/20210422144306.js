const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const moment = require('moment');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    return lspCol.updateMany({}, {
      $set: { vendorPaymentPeriodStartDate: moment().add(1, 'days').utc().toDate() },
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
