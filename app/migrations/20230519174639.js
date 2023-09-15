const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const apPaymentsCol = db.collection('apPayments');
    const apPaymentsColStream = db.collection('apPayments').find({ 'voidDetails.isVoided': true }).stream();
    return new Promise((resolve, reject) => {
      apPaymentsColStream.on('end', resolve);
      apPaymentsColStream.on('error', reject);
      apPaymentsColStream.on('data', (apPayment) => {
        apPaymentsColStream.pause();
        apPaymentsCol.updateOne({ _id: apPayment._id }, { $set: { status: 'voided' } }).then(() => {
          apPaymentsColStream.resume();
        }).catch(() => {
          apPaymentsColStream.resume();
        });
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
