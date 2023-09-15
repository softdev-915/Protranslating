const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requests = db.collection('requests');
    return requests.updateMany({}, {
      $rename: {
        externalId: 'referenceNumber',
      },
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
