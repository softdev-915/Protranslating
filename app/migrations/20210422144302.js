const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const collections = {
      users: db.collection('users'),
      groups: db.collection('groups'),
      roles: db.collection('roles'),
    };
    const groups = await collections.groups.find({ name: 'LSP_ADMIN' }).toArray();
    return addNewRole([
      'LSP-SETTINGS-ACCT_UPDATE_OWN',
      'ACCOUNT_READ_ALL',
      'ACCOUNT_CREATE_ALL',
      'ACCOUNT_UPDATE_ALL',
      'CONNECTOR_READ_ALL',
      'CONNECTOR_UPDATE_ALL',
      'ABILITY_UPDATE_ALL',
      'ABILITY-GL_UPDATE_ALL',
    ], groups, collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
