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
      'MT-MODEL_READ_ALL',
      'MT-MODEL_UPDATE_ALL',
      'MT-MODEL_CREATE_ALL',
      'MT-MODEL_DELETE_ALL',
      'MT-TRANSLATOR_READ_ALL',
    ];
    return addNewRole(newRoles, [], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
