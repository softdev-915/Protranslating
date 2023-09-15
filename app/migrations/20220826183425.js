const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  await addNewRole(['COMPROMISED-PASSWORD_READ_ALL'], [], {
    users: connection.collection('users'),
    groups: connection.collection('groups'),
    roles: connection.collection('roles'),
  });
};

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => {
      throw err;
    });
} else {
  module.exports = migration;
}
