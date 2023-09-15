const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const { mongoose } = await mongo.connect(configuration);
  const connection = await mongoose.connection;
  return addNewRole([
    'BANK-ACCOUNT_READ_ALL', 'BANK-ACCOUNT_CREATE_ALL', 'BANK-ACCOUNT_UPDATE_ALL',
  ], [
    'LSP_ADMIN',
  ], {
    users: connection.collection('users'),
    groups: connection.collection('groups'),
    roles: connection.collection('roles'),
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
