const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const addRoles = async (connection) => {
  const newRoles = [
    'BILL-ADJUSTMENT_CREATE_ALL',
    'BILL-ADJUSTMENT_CREATE_OWN',
    'BILL-ADJUSTMENT_UPDATE_OWN',
  ];
  const collections = {
    users: connection.collection('users'),
    groups: connection.collection('groups'),
    roles: connection.collection('roles'),
  };
  const groups = await collections.groups.find({ name: 'LSP_ADMIN' }).toArray();
  return addNewRole(newRoles, groups, collections);
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  return addRoles(connection);
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
