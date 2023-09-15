const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { renameExistingRoles, renameExistingGroups } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // write your migration logic here.
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    return renameExistingRoles({
      QUOTE_UPATE_ALL: 'QUOTE_UPDATE_ALL',
    }, collections, { roles: /QUOTE_UPATE/ })
      .then(() => renameExistingGroups(/QUOTE_UPATE/, 'QUOTE_UPDATE_', collections, {}));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
