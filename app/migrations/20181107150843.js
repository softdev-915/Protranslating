const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // Remove old index if exist
    let indexesNames;
    return db.collection('users').getIndexes().then((indexes) => {
      indexesNames = Object.keys(indexes);
      if (indexesNames.indexOf('accounts.lsp._id_1') >= 0) {
        return db.collection('users').dropIndex('accounts.lsp._id_1');
      }
    }).then(() => {
      if (indexesNames.indexOf('accounts.groups._id_1') >= 0) {
        return db.collection('users').dropIndex('accounts.groups._id_1');
      }
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
