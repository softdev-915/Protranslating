const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const companiesCol = db.collection('companies');
    const requestsCol = db.collection('requests');
    const projection = {
      _id: 1,
      name: 1,
      hierarchy: 1,
      parentId: 1,
      subParentId: 1,
      subSubParentId: 1,
    };
    companiesCol.find({}, projection).toArray().then(companies =>
      requestsCol.find({ 'company._id': { $exists: true } })
        .toArray()
        .then(requests =>
          Promise.mapSeries(requests, (request) => {
            const hierarchy = _.get(request.company, 'hierarchy', '').split('#');
            if (!_.isEmpty(hierarchy)) {
              const parentId = _.get(hierarchy, '[0]', '');
              const subParentId = _.get(hierarchy, '[1]', '');
              const subSubParentId = _.get(hierarchy, '[2]', '');
              let companyHierarchy = '';
              if (!_.isEmpty(parentId)) {
                const parentCompany = companies.find(company =>
                  company._id.toString() === parentId);
                if (!_.isNil(parentCompany)) {
                  companyHierarchy = parentCompany.name;
                }
              }
              if (!_.isEmpty(subParentId)) {
                const subParentCompany = companies.find(company => company._id.toString() ===
                  subParentId);
                if (!_.isNil(subParentCompany)) {
                  companyHierarchy += ` ${subParentCompany.name}`;
                }
              }
              if (!_.isEmpty(subSubParentId)) {
                const subSubParentCompany = companies.find(company => company._id.toString() ===
                  subSubParentId);
                if (!_.isNil(subSubParentCompany)) {
                  companyHierarchy += ` ${subSubParentCompany.name}`;
                }
              }
              return requestsCol.updateOne({ _id: request._id }, {
                $set: {
                  companyHierarchy: companyHierarchy,
                },
              });
            }
          }),
        ),
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
