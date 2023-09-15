const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const billAdjustmentsColStream = db.collection('billAdjustments').find().stream();
  return new Promise((resolve, reject) => {
    billAdjustmentsColStream.on('end', resolve);
    billAdjustmentsColStream.on('error', reject);
    billAdjustmentsColStream.on('data', async (billAdjustment) => {
      billAdjustmentsColStream.pause();
      if (!_.isNil(billAdjustment.vendor._id)) {
        await db.collection('billAdjustments').findOneAndUpdate({ _id: billAdjustment._id }, {
          $set: {
            vendor: billAdjustment.vendor._id,
          },
        });
      }
      billAdjustmentsColStream.resume();
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
