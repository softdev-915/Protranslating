const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then((connections) => {
    const usersCol = connections.mongoose.connection.collection('users');
    return usersCol.updateMany({}, {
      $set: {
        forcePasswordChange: true,
      },
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
