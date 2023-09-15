const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const arPaymentsColStream = db.collection('arPayments').find().stream();
  return new Promise((resolve, reject) => {
    arPaymentsColStream.on('end', resolve);
    arPaymentsColStream.on('error', reject);
    arPaymentsColStream.on('data', async (arPayment) => {
      arPaymentsColStream.pause();
      if (!_.isNil(arPayment.company._id)) {
        await db.collection('arPayments').findOneAndUpdate({ _id: arPayment._id }, {
          $set: {
            company: arPayment.company._id,
          },
        });
      }
      arPaymentsColStream.resume();
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
