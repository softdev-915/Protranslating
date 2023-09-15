const Promise = require('bluebird');
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
      CUSTOMER_CREATE_ALL: 'COMPANY_CREATE_ALL',
      CUSTOMER_DELETE_ALL: 'COMPANY_DELETE_ALL',
      CUSTOMER_READ_ALL: 'COMPANY_READ_ALL',
      CUSTOMER_UPDATE_ALL: 'COMPANY_UPDATE_ALL',
      REQUEST_READ_CUSTOMER: 'REQUEST_READ_COMPANY',
    }, collections, { 'accounts.0.roles': /CUSTOMER_/ })
    // eslint-disable-next-line arrow-body-style
      .then(() => {
      // Rename existing groups
        return renameExistingGroups(/CUSTOMER_/, 'COMPANY_', collections, {});
      })
      .then(() => collections.customers.find().toArray())
      .then((dbCustomers) => {
        const promises = [];
        dbCustomers.forEach((customer) => {
          customer.subcompanies = customer.subcustomers || [];
          delete customer.subcustomers;
          // eslint-disable-next-line arrow-body-style
          promises.push(() => {
            return collections.companies.update({ _id: customer._id },
              { $set: customer }, { upsert: true });
          });
        });
        // Copy all companies
        return Promise.resolve(promises).mapSeries(f => f());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
