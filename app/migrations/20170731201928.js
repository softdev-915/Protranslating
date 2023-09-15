const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    return addNewRole([
      'WORKFLOW_CREATE_OWN',
      'WORKFLOW_CREATE_ALL',
      'WORKFLOW_UPDATE_OWN',
      'WORKFLOW_UPDATE_ALL',
      'WORKFLOW_READ_OWN',
      'WORKFLOW_READ_ALL',
    ], ['LSP_ADMIN'], collections).then(() => addNewRole([
      'WORKFLOW_CREATE_ALL',
      'WORKFLOW_UPDATE_ALL',
      'WORKFLOW_READ_ALL',
    ], ['LSP_PM'], collections)).then(() => addNewRole([
      'WORKFLOW_READ_OWN',
      'TASK_UPDATE_OWN',
    ], ['LSP_VENDOR', 'LSP_STAFF'], collections));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
