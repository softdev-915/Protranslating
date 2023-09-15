
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const opportunitiesCol = db.collection('opportunities');
    const query = {
      'srcLang.isoCode': 'EN-EN',
    };
    const update = {
      $set: {
        'srcLang.isoCode': 'ENG',
      },
    };
    const options = { upsert: false };
    return opportunitiesCol.updateMany(query, update, options);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
