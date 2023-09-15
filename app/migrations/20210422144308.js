const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { renameExistingRoles } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  await renameExistingRoles({
    'BILL-PAYMENT_READ_ALL': 'AP-PAYMENT_READ_ALL',
    'BILL-PAYMENT_CREATE_ALL': 'AP-PAYMENT_CREATE_ALL',
    'BILL-PAYMENT_UPDATE_ALL': 'AP-PAYMENT_UPDATE_ALL',
    'BILL-PAYMENT_READ_OWN': 'AP-PAYMENT_READ_OWN',
  }, {
    users: db.collection('users'),
    groups: db.collection('groups'),
    roles: db.collection('roles'),
  }, { 'accounts.0.roles': /BILL-PAYMENT/ });
};
if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
