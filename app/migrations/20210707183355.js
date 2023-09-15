const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  await db.collection('users').updateMany(
    { 'vendorDetails.vendorCompany': { $exists: true, $ne: '' } },
    { $set: { siConnector: { isSynced: false } } },
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
