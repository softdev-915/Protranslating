const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    /* We need the name index to be unique and case insensitive. So that we
    don't end up with records like "CAT TOOL 1" and "cat tool 1"
    */
    // Remove old index if exist
    db.collection('catTool').getIndexes().then((indexes) => {
      const indexesNames = Object.keys(indexes);
      if (indexesNames.indexOf('name_1') >= 0) {
        db.collection('catTool').dropIndex('name_1');
      }
      if (indexesNames.indexOf('uniqueName') >= 0) {
        return db.collection('catTool').dropIndex('uniqueName');
      }
    }).then(() => {
      db.collection('catTool').createIndex({ name: 1, lspId: 1 }, {
        unique: true,
        name: 'uniqueName',
        collation: {
          locale: 'en',
          strength: 1,
        },
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
