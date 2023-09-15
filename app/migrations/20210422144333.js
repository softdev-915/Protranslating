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
      'INVOICE_CREATE_ALL',
      'INVOICE_READ_ALL',
      'INVOICE_UPDATE_ALL',
    ], ['LSP_ADMIN'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
