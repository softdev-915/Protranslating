const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const newRoles = [
  'TASK-NOTES_UPDATE_ALL',
  'TASK-STATUS_UPDATE_ALL',
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    return lsp.find({}).toArray()
      .then((lsps) => {
        const lspAdminAllLsps = lsps.map(({ _id }) => ({ name: 'LSP_ADMIN', lspId: _id }));
        return addNewRole(newRoles, lspAdminAllLsps, collections);
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
