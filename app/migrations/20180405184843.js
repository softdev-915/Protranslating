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
    const companies = db.collection('companies');
    const collections = {
      users,
      groups,
      roles,
      companies,
    };
    // Rename role s/PERIOD/TIME/
    return renameExistingRoles({
      'COMPANY-DOC-RET-PERIOD_UPDATE_ALL': 'COMPANY-DOC-RET-TIME_UPDATE_ALL',
    }, collections, { 'accounts.0.roles': /COMPANY-DOC-RET-PERIOD_UPDATE_ALL/ })
    // eslint-disable-next-line arrow-body-style
      .then(() => {
      // Rename existing groups
        return renameExistingGroups(/COMPANY-DOC-RET-PERIOD_UPDATE_ALL/, 'COMPANY-DOC-RET-TIME_UPDATE_ALL', collections, {});
        // eslint-disable-next-line arrow-body-style
      }).then(() => collections.companies.find().toArray())
      .then((dbCompanies) => {
        const promises = [];
        dbCompanies.forEach((company) => {
          if (!company.cidr || company.cidr.length < 2) {
            company.cidr = [{
              ip: '0.0.0.0/0',
              subnet: '0:0:0:0:0:0:0:0/0',
              description: 'All IPv4',
            }, {
              ip: '0:0:0:0:0:0:0:0/0',
              subnet: '0:0:0:0:0:0:0:0/0',
              description: 'All IPv6',
            }];
          }
          if (!company.retention || typeof company.retention.days !== 'number'
          || typeof company.retention.hours !== 'number'
          || typeof company.retention.minutes !== 'number') {
            company.retention = {
              days: 2555, // 7 x 365 (7 years)
              hours: 0,
              minutes: 0,
            };
          }
          // eslint-disable-next-line arrow-body-style
          promises.push(() => {
            return collections.companies.update({ _id: company._id },
              { $set: company });
          });
        });
        // Patch all companies
        return Promise.resolve(promises).mapSeries(f => f());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
