const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { removeRoles } = require('../utils/migrations');

const ROLES_TO_REMOVE = [
  'IP-ORDER_UPDATE_OWN',
  'IP-QUOTE_UPDATE_OWN',
];

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
    return removeRoles(ROLES_TO_REMOVE, collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
