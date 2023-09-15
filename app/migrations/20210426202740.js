const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(async (connections) => {
    const db = connections.mongoose.connection;
    const usersCol = db.collection('users');
    return usersCol.updateMany({},
      {
        $set: {
          forcePasswordChange: false,
        },
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
