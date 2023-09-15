const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole, removeRoles } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    await removeRoles([
      'ACCOUNT_READ_ALL',
      'ACCOUNT_CREATE_ALL',
      'ACCOUNT_UPDATE_ALL',
    ], collections);
    await addNewRole([
      'REVENUE-ACCOUNT_READ_ALL',
      'REVENUE-ACCOUNT_CREATE_ALL',
      'REVENUE-ACCOUNT_UPDATE_ALL',
    ], ['LSP_ADMIN'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
