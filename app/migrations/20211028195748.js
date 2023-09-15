const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const billColStream = db.collection('bills').find().stream();
  return new Promise((resolve, reject) => {
    billColStream.on('end', resolve);
    billColStream.on('error', reject);
    billColStream.on('data', async (bill) => {
      billColStream.pause();
      if (!_.isNil(bill.vendor.vendorId)) {
        await db.collection('bills').findOneAndUpdate({ _id: bill._id }, {
          $set: {
            vendor: bill.vendor.vendorId,
          },
        });
      }
      billColStream.resume();
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
