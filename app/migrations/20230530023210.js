const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;

  await db.collection('users').updateMany(
    { type: 'Vendor', 'vendorDetails.rates': { $type: 'array' } },
    { $set: { 'vendorDetails.rates.$[].rateDetails.$[elem].breakdown': { _id: null } } },
    { arrayFilters: [{ 'elem.breakdown._id': { $exists: false } }] },
  );

  await db.collection('users').updateMany(
    { type: 'Vendor', 'vendorDetails.rates': { $type: 'array' } },
    { $set: { 'vendorDetails.rates.$[].rateDetails.$[elem].translationUnit': { _id: null } } },
    { arrayFilters: [{ 'elem.translationUnit._id': { $exists: false } }] },
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
