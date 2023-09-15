const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const arAdjustmentColStream = db.collection('arAdjustments').find().stream();
  return new Promise((resolve, reject) => {
    arAdjustmentColStream.on('end', resolve);
    arAdjustmentColStream.on('error', reject);
    arAdjustmentColStream.on('data', async (arPayment) => {
      arAdjustmentColStream.pause();
      if (!_.isNil(arPayment.company._id) && !_.isNil(arPayment.contact._id)) {
        await db.collection('arAdjustments').findOneAndUpdate({ _id: arPayment._id }, {
          $set: {
            company: arPayment.company._id,
            contact: arPayment.contact._id,
          },
        });
      }
      arAdjustmentColStream.resume();
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
