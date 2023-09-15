const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const companiesCol = db.collection('companies');
    const setHierarchy = (company, hierarchy = '') => {
      if (!_.isEmpty(_.get(company, 'parentCompany.name', ''))) {
        if (_.isEmpty(hierarchy)) {
          hierarchy = `${company.name}`;
        }
        hierarchy += `:${company.parentCompany.name}`;
        return setHierarchy(company.parentCompany, hierarchy);
      }
      return hierarchy.split(':').reverse().join(' : ').trim();
    };
    return new Promise((resolve, reject) => {
      const stream = companiesCol.find().stream();
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', (company) => {
        stream.pause();
        if (_.isNil(_.get(company, 'parentCompany._id', null))) {
          company.hierarchy = company.name;
        } else {
          company.hierarchy = setHierarchy(company);
        }
        return companiesCol.updateOne({ _id: company._id }, {
          $set: {
            hierarchy: company.hierarchy,
          },
        }).then(() => stream.resume());
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
