const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const usersCollection = db.collection('users');
  await usersCollection.updateMany({ $and: [
    { securityPolicy: { $exists: true } },
    { 'securityPolicy.timeoutInactivity': { $ne: 15 } },
  ] }, { $set: { 'securityPolicy.timeoutInactivity': 15 } });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
