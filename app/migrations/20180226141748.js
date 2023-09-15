const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    return addNewRole([
      'COMPANY-BILLING_READ_OWN',
      'COMPANY-BILLING_UPDATE_OWN',
      'COMPANY-BILLING_UPDATE_ALL',
      'BILLING-TERM_CREATE_ALL',
      'TRANSLATION-UNIT_CREATE_ALL',
      'TRANSLATION-UNIT_UPDATE_ALL',
      'INTERNAL-DEPARTMENT_CREATE_ALL',
      'INTERNAL-DEPARTMENT_READ_ALL',
      'INTERNAL-DEPARTMENT_UPDATE_ALL',
      'PAYMENT-METHOD_READ_ALL',
      'PAYMENT-METHOD_CREATE_ALL',
      'PAYMENT-METHOD_UPDATE_ALL',
      'BILLING-TERM_READ_ALL',
      'TRANSLATION-UNIT_READ_ALL',
      'BILLING-TERM_UPDATE_ALL',
      'FUZZY-MATCH_CREATE_ALL',
      'FUZZY-MATCH_READ_ALL',
      'FUZZY-MATCH_UPDATE_ALL',
      'CURRENCY_CREATE_ALL',
      'CURRENCY_READ_ALL',
      'CURRENCY_UPDATE_ALL'],
    ['LSP_ADMIN', 'LSP_PM'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
