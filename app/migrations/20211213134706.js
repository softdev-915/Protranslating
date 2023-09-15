const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');
const { removeRoles } = require('../utils/migrations');

const envConfig = configuration.environment;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    if (envConfig.NODE_ENV === 'PROD') {
      return Promise.resolve();
    }
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    return addNewRole(['LANGUAGE_CREATE_ALL', 'CURRENCY_CREATE_ALL', 'CURRENCY_UPDATE_ALL', 'LANGUAGE_UPDATE_ALL'], ['LSP_ADMIN'], collections)
      .then(() =>
        removeRoles(['LANGUAGE_READ_ALL'], collections));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
