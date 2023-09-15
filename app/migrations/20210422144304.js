const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const lsp = db.collection('lsp');
    const collections = {
      users,
      groups,
      roles,
      lsp,
    };
    return addNewRole([
      'INTERNAL-DOCUMENT_UPDATE_ALL',
      'INTERNAL-DOCUMENT_READ_ALL',
      'INTERNAL-DOCUMENT_CREATE_ALL',
      'INTERNAL-DOCUMENT_DELETE_ALL',
    ], ['LSP_ADMIN'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
