const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

/**
 * @param {NativeConnection} connection
 * @returns {Promise<void>}
 */
const addRoles = async (connection) => {
  const newRoles = [
    'EXPENSE-ACCOUNT_CREATE_ALL',
    'EXPENSE-ACCOUNT_UPDATE_ALL',
    'EXPENSE-ACCOUNT_READ_ALL',
    'COMPANY-DEPT-RELATIONSHIP_READ_ALL',
    'COMPANY-DEPT-RELATIONSHIP_CREATE_ALL',
    'COMPANY-DEPT-RELATIONSHIP_UPDATE_ALL',
    'VENDOR-MIN-CHARGE_CREATE_ALL',
    'VENDOR-MIN-CHARGE_READ_ALL',
    'VENDOR-MIN-CHARGE_UPDATE_ALL',
    'TASK-FINANCIAL_READ_ALL',
    'TASK-FINANCIAL_READ_OWN',
    'TASK-FINANCIAL_UPDATE_ALL',
    'TASK_READ_WORKFLOW',
    'TASK-APPROVAL_UPDATE_OWN',
    'TASK-APPROVAL_UPDATE_ALL',
    'BILL_READ_OWN',
    'BILL_READ_ALL',
    'BILL-PAYMENT_READ_OWN',
    'BILL-ADJUSTMENT_READ_OWN',
    'BILL-ON-HOLD_UPDATE_ALL',
    'BILL-ON-HOLD_READ_ALL',
    'BILL-ACCT_UPDATE_ALL',
    'BILL-PRIORITY_UPDATE_ALL',
    'BILL-PAYMENT_READ_ALL',
    'BILL-ADJUSTMENT_READ_ALL',
    'BILL-ADJUSTMENT_UPDATE_ALL',
    'BILL-PRIORITY_READ_ALL',
    'BILL-RATE_UPDATE_ALL',
    'GL-DATE_UPDATE_ALL',
  ];
  const collections = {
    users: connection.collection('users'),
    groups: connection.collection('groups'),
    roles: connection.collection('roles'),
  };
  const groups = await collections.groups.find({ name: 'LSP_ADMIN' }).toArray();
  return addNewRole(newRoles, groups, collections);
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  return addRoles(connection);
};

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => {
      throw err;
    });
} else {
  module.exports = migration;
}
