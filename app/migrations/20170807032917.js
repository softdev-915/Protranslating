const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const newRole = 'REQUEST_READ_ASSIGNED-TASK';
    const collections = {
      users,
      groups,
      roles,
    };
    return addNewRole([newRole], ['LSP_ADMIN'], collections).then(() =>
      addNewRole([newRole], ['LSP_VENDOR', 'LSP_STAFF'], collections));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
