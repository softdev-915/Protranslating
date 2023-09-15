const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const expenseAccountsCol = db.collection('expenseAccounts');
    return expenseAccountsCol.getIndexes()
      .then((indexesNames) => {
        if (Object.keys(indexesNames).indexOf('lspId_1_name_1') >= 0) {
          return expenseAccountsCol.dropIndex('lspId_1_name_1');
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
