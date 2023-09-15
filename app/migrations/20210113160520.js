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
    return removeRoles([
      'BILL_CREATE_OWN',
      'BILL_CREATE_ALL',
      'BILL-RATE_UPDATE_ALL',
      'TRANSACTION-APPROVAL_UPDATE_OWN',
      'TRANSACTION_CREATE_ALL',
      'TRANSACTION_CREATE_OWN',
      'TRANSACTION_READ_ALL',
      'TRANSACTION_READ_OWN',
      'TRANSACTION_UPDATE_ALL',
      'TRANSACTION_UPDATE_OWN',
    ], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
