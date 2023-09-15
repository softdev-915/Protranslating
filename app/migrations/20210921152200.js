const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const indexes = await db.collection('bankAccounts').getIndexes();
  const indexNames = Object.keys(indexes);
  let needReindex = false;
  if (indexNames.indexOf('lspId_1_name_1') === -1) {
    await db.collection('bankAccounts').createIndex(
      { lspId: 1, name: 1 },
      { unique: true, background: true, name: 'lspId_1_name_1' },
    );
    needReindex = true;
  }
  if (indexNames.indexOf('lspId_1_no_1') === -1) {
    await db.collection('bankAccounts').createIndex(
      { lspId: 1, no: 1 },
      { unique: true, background: true, name: 'lspId_1_no_1' },
    );
    needReindex = true;
  }
  if (indexNames.indexOf('lspId_1_name_1_no_1') !== -1) {
    await db.collection('bankAccounts').dropIndex('lspId_1_name_1_no_1');
  }
  if (needReindex) {
    await db.collection('bankAccounts').reIndex();
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
