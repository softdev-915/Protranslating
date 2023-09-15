const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db =>
    db.collection('counters').getIndexes().then((indexes) => {
      const indexesNames = Object.keys(indexes);
      if (indexesNames.indexOf('lspId_1_name_1_date_1_seq_1') < 0) {
        return db.collection('counters').createIndex({ date: 1, name: 1, lspId: 1, seq: 1 }, {
          unique: true,
          name: 'lspId_1_name_1_date_1_seq_1',
        });
      }
    }),
  );

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
