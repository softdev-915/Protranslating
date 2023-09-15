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
    ];
    const newRoles = [
      'CAT-RESOURCES_CREATE_ALL',
      'CAT-RESOURCES_READ_ALL',
      'CAT-RESOURCES_UPDATE_ALL',
      'CAT-RESOURCES_DELETE_ALL',
      'STATISTICS_READ_ALL',
      'STATISTICS_READ_OWN',
      'STATISTICS_READ_COMPANY',
      'PIPELINE-RUN_UPDATE_ALL',
      'PIPELINE_READ_ALL',
      'SEGMENT_UPDATE_ALL',
      'SEGMENT-JOIN_UPDATE_ALL',
      'SEGMENT_UPDATE_OWN',
      'SEGMENT-JOIN_UPDATE_OWN',
    ];
    const collections = {
      users,
      groups,
      roles,
    };
    return lspCol.find().toArray()
      .then((lsps) => {
        const groupsToUpdate = lsps.map(({ _id }) => ({ name: 'LSP_ADMIN', lspId: _id }));
        return removeRoles(oldRoles, collections)
          .then(() => addNewRole(newRoles, groupsToUpdate, collections));
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
