const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const users = db.collection('users');
  await users.updateMany({}, {
    $set: {
      monthlyApiQuota: 100000,
      monthlyConsumedQuota: 0,
      lastApiRequestedAt: null },
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
