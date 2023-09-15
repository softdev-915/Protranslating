const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const users = db.collection('users');
  const groups = db.collection('groups');
  const roles = db.collection('roles');
  const collections = {
    users,
    groups,
    roles,
  };
  const newRoles = [
    'LSP-SETTINGS-CAT_READ_OWN',
    'LSP-SETTINGS-CAT_UPDATE_OWN',
    'COMPANY-SETTINGS-CAT_READ_ALL',
    'COMPANY-SETTINGS-CAT_UPDATE_ALL',
    'REQUEST-LOCK-CONFIG_READ_ALL',
    'REQUEST-LOCK-CONFIG_UPDATE_ALL',
  ];
  return addNewRole(newRoles, ['LSP_ADMIN'], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
