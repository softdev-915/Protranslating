const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  await db.collection('users').updateMany(
    { type: 'Vendor', 'vendorDetails.type': { $exists: false } },
    { $set: { 'vendorDetails.type': 'V3' } },
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
