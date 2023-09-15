const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    return users.updateMany({
      type: 'Vendor',
      vendorDetails: { $exists: true },
      terminated: true,
    }, {
      $set: {
        'vendorDetails.vendorStatus': 'Relationship ended by LSP',
      },
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
