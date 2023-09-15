const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const NEW_ROLES = [
  'COMPANY_READ_OWN',
  'CONTACT_READ_OWN',
  'CONTACT_CC_READ_COMPANY',
  'DOCUMENTATION_READ_ALL',
  'QUOTE_READ_OWN',
  'QUOTE_UPDATE_OWN',
  'INVOICE_READ_OWN',
  'INVOICE_UPDATE_OWN',
  'REQUEST_CREATE_OWN',
  'REQUEST_READ_OWN',
  'REQUEST_UPDATE_OWN',
  'IP-ORDER_CREATE_OWN',
  'IP-ORDER_READ_OWN',
  'IP-ORDER_UPDATE_OWN',
  'IP-QUOTE_CREATE_OWN',
  'IP-QUOTE_READ_OWN',
  'IP-QUOTE_UPDATE_OWN',
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    return lspCol.findOne({ name: 'BIG IP' })
      .then((bigIp) => {
        if (!bigIp) {
          throw new Error('Big IP lsp not found in db');
        }
        return addNewRole(NEW_ROLES, [{ name: 'BIG_COMPANY_STAFF', lspId: bigIp._id }], collections);
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
