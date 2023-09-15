const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    return templatesCol.getIndexes()
      .then((indexesNames) => {
        if (Object.keys(indexesNames).indexOf('company_1') >= 0) {
          return templatesCol.dropIndex({ company: 1 });
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
