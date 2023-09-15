const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };

    const newRoles = [
      'CAT-RESOURCES_READ_ALL',
      'CAT-RESOURCES_CREATE_ALL',
      'CAT-RESOURCES_UPDATE_ALL',
      'CAT-RESOURCES_DELETE_ALL',
      'STATISTICS_READ_ALL',
      'STATISTICS_READ_OWN',
      'STATISTICS_READ_COMPANY',
      'PIPELINE-RUN_UPDATE_ALL',
    ];
    return addNewRole(newRoles, [], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
