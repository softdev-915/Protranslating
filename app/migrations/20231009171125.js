const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const users = db.collection('users');
  const groups = db.collection('groups');
  const roles = db.collection('roles');
  const collections = {
    users,
    groups,
    roles,
  };
  await addNewRole([
    'TASK-REGULATORY-FIELDS_READ_OWN',
    'TASK-REGULATORY-FIELDS_READ_WORKFLOW',
    'TASK-REGULATORY-FIELDS_READ_ALL',
    'TASK-REGULATORY-FIELDS_UPDATE_ALL',
    'TASK-NOTES_READ_ALL',
  ],
  ['LSP_ADMIN'], collections);
  await addNewRole([
    'TASK-REGULATORY-FIELDS_READ_ALL',
    'TASK-REGULATORY-FIELDS_UPDATE_ALL',
  ],
  ['LSP_PM'], collections);
  await addNewRole([
    'TASK-REGULATORY-FIELDS_READ_OWN',
  ],
  ['LSP_VENDOR'], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
