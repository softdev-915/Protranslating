const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { removeRoles } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const collections = {
      users: db.collection('users'),
      groups: db.collection('groups'),
      roles: db.collection('roles'),
    };
    return removeRoles(['FILTER-CONFIG_DELETE_ALL', 'FILTER-CONFIG_READ_ALL', 'FILTER-CONFIG_UPDATE_ALL'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
