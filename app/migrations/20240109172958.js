const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // Remove old index if exist
    db.collection('arInvoices').getIndexes().then((indexes) => {
      const indexesNames = Object.keys(indexes);
      if (indexesNames.indexOf('id_1_entries._id_1') >= 0) {
        return db.collection('arInvoices').dropIndex('id_1_entries._id_1');
      }
      return indexesNames;
    }).then((indexesNames) => {
      if (indexesNames.indexOf('_id_1_entries._id_1') < 0) {
        db.collection('arInvoices').createIndex({
          _id: 1,
          'entries._id': 1,
        }, { unique: true });
      }
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
