const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  await db.collection('companies').updateMany({}, { $set: { dataClassification: 'Public' } });
  await db.collection('requests').updateMany({}, { $set: { dataClassification: 'Public' } });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
