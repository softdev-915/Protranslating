const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const {
  addNewRole, removeRoles,
} = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const oldRoles = [
      'MT-SETTINGS_READ_ALL',
      'MT-SETTINGS_CREATE_ALL',
      'MT-SETTINGS_UPDATE_ALL',
    ];
    const newRoles = [
      'MT-ENGINES_READ_ALL',
      'MT-ENGINES_CREATE_ALL',
      'MT-ENGINES_UPDATE_ALL',
    ];
    const collections = {
      users,
      groups,
      roles,
    };
    return lspCol.find({
      $or: [{
        name: 'Protranslating',
      }, {
        name: 'PTI',
      }, {
        name: 'BIG IP',
      }],
    }).toArray()
      .then((lsps) => {
        const ptiLsp = lsps.find(l => l.name === 'PTI');
        const ptsLsp = lsps.find(l => l.name === 'Protranslating');
        const bigIpLsp = lsps.find(l => l.name === 'BIG IP');
        return removeRoles(oldRoles, collections)
          .then(() => addNewRole(newRoles, [{
            name: 'LSP_ADMIN',
            lspId: ptsLsp._id,
          }, {
            name: 'LSP_ADMIN',
            lspId: ptiLsp._id,
          }, {
            name: 'LSP_ADMIN',
            lspId: bigIpLsp._id,
          }], collections));
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
