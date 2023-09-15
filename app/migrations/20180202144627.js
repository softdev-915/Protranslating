const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const companies = db.collection('companies');
    const collections = {
      companies,
    };
    return collections.companies.update({},
      { $set: {
        'retention.days': 2555, // 7 x 365
        'retention.hours': 0,
        'retention.minutes': 0,
      },
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
