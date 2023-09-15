const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

let newPaymentMethods = [
  { name: 'Check' },
  { name: 'ACH' },
  { name: 'Paypal' },
  { name: 'Credit Card' },
  { name: 'Wire Transfer' },
  { name: 'Cash' },
];
const insertIfMissing = (paymentMethods, newPaymentMethod) =>
  paymentMethods.findOne({
    name: newPaymentMethod.name,
    lspId: newPaymentMethod.lspId,
  })
    .then((paymentMethod) => {
      if (!paymentMethod) {
        return paymentMethods.insert(newPaymentMethod);
      }
      return paymentMethods.update({
        name: newPaymentMethod.name,
        lspId: newPaymentMethod.lspId,
      }, {
        $set: newPaymentMethod,
      });
    });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Protranslating' }).then((lsp) => {
      newPaymentMethods = newPaymentMethods.map(paymentMethod => ({
        name: paymentMethod.name,
        lspId: lsp._id,
      }));
      const paymentsCollection = db.collection('paymentMethods');
      return Promise.mapSeries(newPaymentMethods, paymentMethod =>
        insertIfMissing(paymentsCollection, paymentMethod));
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
