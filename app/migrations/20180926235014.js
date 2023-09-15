const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // Add new roles for both LSP
    const lspCol = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const newRoles = ['LSP-SETTINGS_UPDATE_OWN', 'LSP-SETTINGS_READ_OWN'];
    const collections = {
      users,
      groups,
      roles,
    };
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        const ptiLsp = lsps.find(l => l.name === 'PTI');
        const ptsLsp = lsps.find(l => l.name === 'Protranslating');
        addNewRole(newRoles, [{
          name: 'LSP_ADMIN',
          lspId: ptsLsp._id,
        }, {
          name: 'LSP_ADMIN',
          lspId: ptiLsp._id,
        }], collections);
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
