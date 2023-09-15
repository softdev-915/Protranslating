const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    return lspCol.getIndexes()
      .then((indexesNames) => {
        if (Object.keys(indexesNames).indexOf('logoImage.md5_1') >= 0) {
          return lspCol.dropIndex('logoImage.md5_1');
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
