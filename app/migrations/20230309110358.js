const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { renameExistingRoles } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const collections = {
    users: db.collection('users'),
    groups: db.collection('groups'),
    roles: db.collection('roles'),
  };
  return renameExistingRoles(
    { 'VENDOR-DASHBOARD_UPDATE_OWN': 'VENDOR-DASHBOARD-FILTER_READ_OWN' },
    collections,
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
