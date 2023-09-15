const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    db.collection('requests').createIndex(
      { '$**': 'text' },
      {
        name: 'requests_full_text',
        default_language: 'en',
        language_override: 'en',
      },
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
