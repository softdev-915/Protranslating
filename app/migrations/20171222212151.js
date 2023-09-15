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
      'REQUEST-DOCUMENT_READ_CUSTOMER': 'REQUEST-DOCUMENT_READ_COMPANY',
      REQUEST_READ_CUSTOMER: 'REQUEST_READ_COMPANY',
    }, collections, { 'accounts.0.roles': /_CUSTOMER/ })
    // eslint-disable-next-line arrow-body-style
      .then(() => {
      // Rename existing groups
        return renameExistingGroups(/_CUSTOMER/, '_COMPANY', collections, {});
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
