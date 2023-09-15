const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const collection = db.collection('apPayments');
  const indexes = await collection.getIndexes();
  if (Object.keys(indexes).indexOf('status_1_lspId_1') >= 0) {
    await collection.dropIndex('status_1_lspId_1');
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
