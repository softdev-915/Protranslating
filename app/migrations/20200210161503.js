const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const denormalizeCompanies = (request, companies) => {
  const companyId = _.get(request, 'company._id', request.company);
  const company = companies.find(c => c._id.equals(companyId));
  if (_.get(company, '_id', null) && !_.isEmpty(companyId)) {
    request.company = {
      _id: company._id,
      name: company.name,
      hierarchy: company.hierarchy,
      internalDepartments: company.internalDepartments,
      cidr: _.get(company, 'cidr'),
    };
  }
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const companiesCol = db.collection('companies');
    return companiesCol.find({}, '_id name hierarchy cidr internalDepartments').toArray()
      .then(companies => requestsCol.find().toArray()
        .then((requests) => {
          requests = requests.map((request) => {
            denormalizeCompanies(request, companies);
            return request;
          });
          return Promise.map(
            requests,
            request => requestsCol.updateOne(
              { _id: request._id },
              { $set: { company: request.company } },
            ),
            { concurrency: 10 },
          );
        }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
