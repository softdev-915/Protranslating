const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const updates = [
      () => users.updateMany({ inactive: true },
        { $set: { deleted: true },
          $unset: { inactive: 1 } },
        { multi: true }),
      () => users.updateMany({ inactive: false },
        { $set: { deleted: false },
          $unset: { inactive: 1 } },
        { multi: true }),
    ];
    return Promise.mapSeries(updates, f => f());
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
