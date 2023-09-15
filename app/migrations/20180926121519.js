const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const newRoles = [
  'ACTIVITY_READ_ALL',
  'ACTIVITY-EMAIL_READ_ALL',
  'ACTIVITY-EMAIL_READ_OWN',
  'ACTIVITY-EMAIL_CREATE_ALL',
  'ACTIVITY-EMAIL_UPDATE_ALL',
  'ACTIVITY-EMAIL_CREATE_OWN',
  'ACTIVITY-EMAIL_UPDATE_OWN',
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const collections = {
      users: db.collection('users'),
      groups: db.collection('groups'),
      roles: db.collection('roles'),
    };
    return addNewRole(newRoles, ['LSP_ADMIN'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
