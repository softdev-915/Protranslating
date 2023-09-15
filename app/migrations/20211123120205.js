const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const expenseAccountsCol = db.collection('expenseAccounts');
  const indexes = await expenseAccountsCol.getIndexes();
  if (Object.keys(indexes).indexOf('lspId_1_name_1') >= 0) {
    await expenseAccountsCol.dropIndex('lspId_1_name_1');
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
