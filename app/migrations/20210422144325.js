const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const newRoles = [
      'INVOICE-ACCT_READ_ALL',
      'AR-ADJUSTMENT_CREATE_ALL',
      'AR-ADJUSTMENT_READ_ALL',
      'AR-ADJUSTMENT_READ_OWN',
      'AR-ADJUSTMENT_READ_COMPANY',
      'AR-ADJUSTMENT-ACCT_READ_ALL',
      'AR-ADJUSTMENT_UPDATE_ALL',
      'AR-ADJUSTMENT_UPDATE_OWN',
      'AR-PAYMENT_CREATE_ALL',
      'AR-PAYMENT_CREATE_COMPANY',
      'AR-PAYMENT_READ_ALL',
      'AR-PAYMENT_READ_OWN',
      'AR-PAYMENT_READ_COMPANY',
      'AR-PAYMENT-ACCT_READ_ALL',
      'AR-PAYMENT_UPDATE_ALL',
      'AR-PAYMENT_UPDATE_OWN',
      'CC-PAYMENT_READ_ALL',
    ];
    const collections = {
      users,
      groups,
      roles,
    };
    return addNewRole(newRoles, ['LSP_ADMIN'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
