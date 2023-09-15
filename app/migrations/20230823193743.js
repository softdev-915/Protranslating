const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole, addGroupRoles } = require('../utils/migrations');

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
  await addNewRole([
    'SERVICE-TYPE_READ_ALL',
    'SERVICE-TYPE_CREATE_ALL',
    'SERVICE-TYPE_UPDATE_ALL',
    'DELIVERY-TYPE_READ_ALL',
    'DELIVERY-TYPE_CREATE_ALL',
    'DELIVERY-TYPE_UPDATE_ALL',
  ],
  ['LSP_ADMIN', 'LSP_PM'], collections);

  const pmGroups = await collections.groups.find({ name: 'LSP_PM' }).toArray();
  await Promise.all(pmGroups.map(g => addGroupRoles(g, 'TEMPLATE_UPDATE_ALL', collections)));
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
