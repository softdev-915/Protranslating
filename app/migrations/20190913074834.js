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
    let pti;
    return collections.lsp.findOne({ name: 'Protranslating' })
      .then((ptiLsp) => {
        pti = ptiLsp;
        return collections.groups.findOne({
          name: 'LSP_ADMIN',
          lspId: ptiLsp._id,
        });
      })
      .then((groupFound) => {
        if (!groupFound) {
          return collections.groups.insert({ name: 'LSP_ADMIN', lspId: pti._id });
        }
        return Promise.resolve();
      }).then(() => addNewRole([
        'BILL-RATE_UPDATE_ALL',
        'TRANSACTION_READ_ALL',
        'TRANSACTION_CREATE_ALL',
        'TRANSACTION_UPDATE_ALL',
        'BILL_CREATE_ALL',
        'BILL_UPDATE_ALL',
      ], [{ name: 'LSP_ADMIN', lspId: pti._id }], collections));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
