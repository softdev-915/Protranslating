const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    return usersCol.update({},
      { $set: { forcePasswordChange: true } },
      {
        upsert: true,
        multi: true,
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
