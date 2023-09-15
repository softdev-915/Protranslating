const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const arPaymentCol = db.collection('arPayments');
    return arPaymentCol.getIndexes().then((indexes) => {
      if (Object.keys(indexes).indexOf('lspId_1__id_1') >= 0) {
        return arPaymentCol.dropIndex('lspId_1__id_1');
      }
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
