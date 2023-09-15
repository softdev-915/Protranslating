const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole, removeRoles } = require('../utils/migrations');

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

  await removeRoles(['ACTION-CONFIG_DELETE_ALL'], collections);
  return addNewRole(['ACTION-CONFIG_CREATE_ALL'], [], collections, true);
};
if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
