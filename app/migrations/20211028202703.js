const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const apPaymentColStream = db.collection('apPayments').find().stream();
  return new Promise((resolve, reject) => {
    apPaymentColStream.on('end', resolve);
    apPaymentColStream.on('error', reject);
    apPaymentColStream.on('data', async (apPayment) => {
      apPaymentColStream.pause();
      if (!_.isNil(apPayment.vendor._id)) {
        await db.collection('apPayments').findOneAndUpdate({ _id: apPayment._id }, {
          $set: {
            vendor: apPayment.vendor._id,
          },
        });
      }
      apPaymentColStream.resume();
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
