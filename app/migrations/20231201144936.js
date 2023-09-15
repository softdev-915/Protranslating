const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lspCol = db.collection('lsp');
  const breakdownCol = db.collection('breakdowns');
  const lsps = await lspCol.find({ pcSettings: { $exists: true, $nin: [null, ''] } }).toArray();
  await Promise.mapSeries(lsps, async (lsp) => {
    const defaultValues = await breakdownCol.find({
      $or: [{
        lspId: lsp._id,
        name: '100%',
      }, {
        lspId: lsp._id,
        name: '101%',
      }],
    }).toArray();
    const defaultLockedSegments = defaultValues.map(value => value._id);
    await lspCol.updateOne(
      { _id: lsp._id },
      {
        $set: {
          'pcSettings.lockedSegments.segmentsToLock': defaultLockedSegments,
        },
      },
      { upsert: true, timeStamps: false },
    );
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
