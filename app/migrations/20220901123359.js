const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const users = db.collection('users');
  const groups = db.collection('groups');
  const roles = db.collection('roles');
  const newRoles = ['CONTACT-DASHBOARD_READ_OWN', 'CONTACT-DASHBOARD-FILTER_READ_OWN'];
  const collections = {
    users,
    groups,
    roles,
  };
  return addNewRole(newRoles, ['LSP_ADMIN'], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
