const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  const collections = {
    users: connection.collection('users'),
    groups: connection.collection('groups'),
    roles: connection.collection('roles'),
  };
  const groups = await collections.groups.find({ name: 'LSP_ADMIN' }).toArray();
  await addNewRole('REQUEST-PO_UPDATE_ALL', groups, collections);
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
