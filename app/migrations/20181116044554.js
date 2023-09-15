const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const newRoles = [
  'DOCUMENT-TYPE_CREATE_ALL',
  'DOCUMENT-TYPE_READ_ALL',
  'DOCUMENT-TYPE_UPDATE_ALL',
  'DELIVERY-METHOD_CREATE_ALL',
  'DELIVERY-METHOD_READ_ALL',
  'DELIVERY-METHOD_UPDATE_ALL',
  'SOFTWARE-REQUIREMENT_CREATE_ALL',
  'SOFTWARE-REQUIREMENT_READ_ALL',
  'SOFTWARE-REQUIREMENT_UPDATE_ALL',
  'PROJECTED-RATE_READ_ALL',
  'PROJECTED-RATE_UPDATE_ALL',
  'STAFF-RATES_CREATE_ALL',
  'STAFF-RATES_READ_ALL',
  'STAFF-RATES_UPDATE_ALL',
  'VENDOR-RATES_CREATE_ALL',
  'VENDOR-RATES_READ_ALL',
  'VENDOR-RATES_UPDATE_ALL',
  'INVOICE-RATE_UPDATE_ALL',
  'QUOTE-TEMPLATE_READ_ALL',
  'QUOTE-TEMPLATE_CREATE_ALL',
  'QUOTE-TEMPLATE_UPDATE_ALL',
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // Add new roles
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
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
