const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db =>
    db.collection('users').getIndexes().then((indexes) => {
      const indexesNames = Object.keys(indexes);
      if (indexesNames.indexOf('email_1_lsp_1') < 0) {
        return db.collection('users').createIndex({ email: 1, lsp: 1 }, { unique: true });
      }
    }),
  );

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
