// const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { renameExistingRoles, renameExistingGroups } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // write your migration logic here.
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const customers = db.collection('customers');
    const companies = db.collection('companies');
    const collections = {
      users,
      groups,
      roles,
      customers,
      companies,
    };
    return renameExistingRoles({
      CONTACT_CC_READ_CUSTOMER: 'CONTACT_CC_READ_COMPANY',
      CONTACT_READ_CUSTOMER: 'CONTACT_READ_COMPANY',
      INVOICE_READ_CUSTOMER: 'INVOICE_READ_COMPANY',
      INVOICE_UPDATE_CUSTOMER: 'INVOICE_UPDATE_COMPANY',
      REQUEST_CREATE_CUSTOMER: 'REQUEST_CREATE_COMPANY',
      REQUEST_DELETE_CUSTOMER: 'REQUEST_DELETE_COMPANY',
      REQUEST_READ_CUSTOMER: 'REQUEST_READ_COMPANY',
      REQUEST_UPDATE_CUSTOMER: 'REQUEST_UPDATE_COMPANY',
      QUOTE_READ_CUSTOMER: 'QUOTE_READ_COMPANY',
      QUOTE_UPDATE_CUSTOMER: 'QUOTE_UPDATE_COMPANY',
    }, collections, { 'accounts.0.roles': /_CUSTOMER/ })
    // eslint-disable-next-line arrow-body-style
      .then(() => {
      // Rename existing groups
        return renameExistingGroups(/_CUSTOMER/, '_COMPANY', collections, {});
        // eslint-disable-next-line arrow-body-style
      }).then(() => {
      // Rename aditional roles found in db
        return renameExistingRoles({
          'CUSTOMER-DOC-RET-PERIOD_UPDATE_ALL': 'COMPANY-DOC-RET-PERIOD_UPDATE_ALL',
          CUSTOMER_READ_CUSTOMER: 'COMPANY_READ_COMPANY',
          CUSTOMER_READ_OWN: 'COMPANY_READ_OWN',
        }, collections, { 'accounts.0.roles': /CUSTOMER/ });
        // eslint-disable-next-line arrow-body-style
      }).then(() => {
      // Rename existing groups
        return renameExistingGroups(/CUSTOMER/, 'COMPANY', collections, {});
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
