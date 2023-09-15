const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const currenciesCol = db.collection('currencies');
    return currenciesCol.getIndexes()
      .then((indexesNames) => {
        if (Object.keys(indexesNames).indexOf('name_1_lspId_1') >= 0) {
          return currenciesCol.dropIndex('name_1_lspId_1');
        }
      });
    // write your migration logic here.
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
