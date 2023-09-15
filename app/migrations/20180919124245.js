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
    let pts;
    return collections.lsp.findOne({ name: 'Protranslating' })
      .then((ptsLsp) => {
        pts = ptsLsp;
        return collections.groups.findOne({
          name: 'LSP_HR',
          lspId: ptsLsp._id,
        });
      })
      .then((groupFound) => {
        if (!groupFound) {
          return collections.groups.insert({ name: 'LSP_HR', lspId: pts._id });
        }
        return Promise.resolve();
      }).then(() => addNewRole([
        'ACTIVITY-VES1_READ_ALL',
        'ACTIVITY-VES1_CREATE_ALL',
        'ACTIVITY-VES1_UPDATE_ALL',
        'ACTIVITY-VES2_READ_ALL',
        'ACTIVITY-VES2_CREATE_ALL',
        'ACTIVITY-VES2_UPDATE_ALL',
        'ACTIVITY-VES-T_READ_ALL',
        'ACTIVITY-VES-T_CREATE_ALL',
        'ACTIVITY-VES-T_UPDATE_ALL',
        'ACTIVITY-VES-B_READ_ALL',
        'ACTIVITY-VES-B_CREATE_ALL',
        'ACTIVITY-VES-B_UPDATE_ALL',
        'ACTIVITY-CA_READ_ALL',
        'ACTIVITY-CA_CREATE_ALL',
        'ACTIVITY-CA_UPDATE_ALL',
        'ACTIVITY-FR_READ_ALL',
        'ACTIVITY-FR_CREATE_ALL',
        'ACTIVITY-FR_UPDATE_ALL',
      ], [{ name: 'LSP_HR', lspId: pts._id }], collections));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
