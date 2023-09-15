const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const providerPoolingOffersCol = db.collection('providerPoolingOffers');
  const stream = providerPoolingOffersCol.find({}).stream();
  stream.on('error', (err) => {
    throw err;
  });
  stream.on('data', async (record) => {
    stream.pause();
    try {
      const set = {};
      if (record.translationUnit || record.translationUnitId) {
        set.translationUnitId = record.translationUnit || record.translationUnitId;
      }
      if (record.breakdown || record.breakdownId) {
        set.breakdownId = record.breakdown || record.breakdownId;
      }

      await providerPoolingOffersCol.updateOne(
        { _id: record._id },
        {
          $unset:
          {
            translationUnit: 1,
            breakdown: 1,
          },
          $set: set,
        },
        { timeStamps: false },
      );
      stream.resume();
    } catch (e) {
      stream.resume();
    }
    stream.resume();
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
