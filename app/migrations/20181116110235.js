const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const envConfig = configuration.environment;
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
      lsp,
    };
    let pts;
    const groupsToFind = ['LSP_PM'];
    let groupsToAddRoles;
    if (envConfig.NODE_ENV !== 'PROD') {
      groupsToFind.push('LSP_PM_UK');
    }
    return collections.lsp.findOne({ name: 'Protranslating' })
      .then((ptsLsp) => {
        pts = ptsLsp;
        return collections.groups.find({
          name: { $in: groupsToFind },
          lspId: ptsLsp._id,
        }).toArray();
      })
      .then((groupsFound) => {
        const groupsToInsert = [];
        groupsToAddRoles = groupsToFind.map(name => ({ name, lspId: pts._id }));
        if (!groupsFound.find(g => g.name === 'LSP_PM')) {
          groupsToInsert.push({ name: 'LSP_PM', lspId: pts._id });
        }

        if (envConfig.NODE_ENV !== 'PROD' && !groupsFound.find(g => g.name === 'LSP_PM_UK')) {
          groupsToInsert.push({ name: 'LSP_PM_UK', lspId: pts._id });
        }

        if (!groupsToInsert.length) {
          return Promise.resolve();
        }
        return collections.groups.insertMany(groupsToInsert);
      }).then(() => addNewRole([
        'ACTIVITY-NC-CC_CREATE_OWN',
        'ACTIVITY-NC-CC_READ_OWN',
        'ACTIVITY-NC-CC_UPDATE_OWN',
        'ACTIVITY-VES1_READ_ALL',
        'ACTIVITY-VES2_READ_ALL',
        'ACTIVITY-VES-T_READ_ALL',
        'ACTIVITY-VES-B_READ_ALL',
        'ACTIVITY-CA_READ_ALL',
        'ACTIVITY-FR_READ_ALL',
      ], groupsToAddRoles, collections));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
