const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRolesWithoutGroups } = require('../utils/migrations');

const migration = () =>
  mongo
    .connect(configuration)
    .then(connections => connections.mongoose.connection)
    .then((db) => {
      const rolesCollection = db.collection('roles');
      const rolesDataToAdd = [
        'BILL-RATE_UPDATE_ALL',
        'TRANSACTION_READ_ALL',
        'TRANSACTION_CREATE_ALL',
        'TRANSACTION_UPDATE_ALL',
        'TRANSACTION_READ_OWN',
        'TRANSACTION_CREATE_OWN',
        'TRANSACTION_UPDATE_OWN',
        'BILL_CREATE_ALL',
        'BILL_UPDATE_ALL',
        'BILL_CREATE_OWN',
        'BILL_UPDATE_OWN',
        'TRANSACTION-APPROVAL_UPDATE_OWN',
      ];
      return addNewRolesWithoutGroups(rolesDataToAdd, rolesCollection);
    });

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => {
      throw err;
    });
} else {
  module.exports = migration;
}
