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
  const LSP_CAT_NEW_ROLES = [
    'LSP-SETTINGS-CAT_READ_OWN',
    'LSP-SETTINGS-CAT_UPDATE_OWN',
  ];
  await addNewRole(LSP_CAT_NEW_ROLES, ['LSP_CAT_ADMIN'], collections);
  const PM_CAT_NEW_ROLES = [
    'COMPANY-SETTINGS-CAT_READ_ALL',
    'COMPANY-SETTINGS-CAT_UPDATE_ALL',
  ];
  await addNewRole(PM_CAT_NEW_ROLES, ['LSP_CAT_PM'], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
