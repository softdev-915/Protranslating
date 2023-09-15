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
  await addNewRole([
    'PROVIDER-TASK-INSTRUCTIONS_CREATE_ALL',
    'PROVIDER-TASK-INSTRUCTIONS_READ_ALL',
    'PROVIDER-TASK-INSTRUCTIONS_UPDATE_ALL',
  ],
  ['LSP_ADMIN', 'LSP_PM'], collections);
  await addNewRole([
    'PROVIDER-TASK-INSTRUCTIONS_READ_OWN',
  ],
  ['LSP_VENDOR'], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
