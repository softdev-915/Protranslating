const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const {
  addNewRole,
} = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const newRoles = [
      'PIPELINE-PANEL_READ_ALL',
      'PIPELINE-PANEL_UPDATE_ALL',
      'RESOURCES-PANEL_READ_ALL',
      'RESOURCES-PANEL_UPDATE_ALL',
      'FILES-PANEL_READ_ALL',
      'FILES-PANEL_UPDATE_ALL',
      'EDITOR-PANEL_READ_ALL',
      'EDITOR-PANEL_UPDATE_ALL',
      'PREVIEW-PANEL_READ_ALL',
      'PREVIEW-PANEL_UPDATE_ALL',
      'MT-SETTINGS_READ_ALL',
      'MT-SETTINGS_CREATE_ALL',
      'MT-SETTINGS_UPDATE_ALL',
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
        name: 'Big IP',
      }],
    }).toArray()
      .then((lsps) => {
        const ptiLsp = lsps.find(l => l.name === 'PTI');
        const ptsLsp = lsps.find(l => l.name === 'Protranslating');
        const bigIpLsp = lsps.find(l => l.name === 'Big IP');
        return addNewRole(newRoles, [{
          name: 'LSP_ADMIN',
          lspId: ptsLsp._id,
        }, {
          name: 'LSP_ADMIN',
          lspId: ptiLsp._id,
        }, {
          name: 'LSP_ADMIN',
          lspId: bigIpLsp._id,
        }], collections);
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
