const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const NEW_ROLES = [
  'WORKFLOW-TEMPLATE_READ_ALL',
  'WORKFLOW-TEMPLATE_CREATE_ALL',
  'WORKFLOW-TEMPLATE_UPDATE_ALL',
];

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const users = db.collection('users');
  const groups = db.collection('groups');
  const roles = db.collection('roles');
  const oldTemplatesCollection = db.collection('workflowTemplates');
  const collections = {
    users,
    groups,
    roles,
  };
  await oldTemplatesCollection.deleteMany({});
  return addNewRole(NEW_ROLES, ['LSP_ADMIN'], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
