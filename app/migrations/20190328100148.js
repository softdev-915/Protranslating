const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { removeGroupRoles } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const groupCollection = db.collection('groups');
    const rolesToRemoveFromAdmin = [
      'ACTIVITY-NC-CC_CREATE_ALL',
      'ACTIVITY-NC-CC_UPDATE_ALL',
      'ACTIVITY-NC-CC_UPDATE_OWN',
      'ACTIVITY-NC-CC_READ_ALL',
      'ACTIVITY-NC-CC_CREATE_OWN',
      'ACTIVITY-NC-CC_READ_OWN',
      'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
      'ACTIVITY-NC-CC_READ_DEPARTMENT',
      'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
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
      'ACTIVITY-TAG_CREATE_ALL',
      'ACTIVITY-TAG_READ_ALL',
      'ACTIVITY-TAG_UPDATE_ALL',
    ];
    return removeGroupRoles(rolesToRemoveFromAdmin, groupCollection, ['LSP_ADMIN']);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
