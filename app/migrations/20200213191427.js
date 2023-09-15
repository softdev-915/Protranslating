const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const denormalizeRequestor = (request, companies) => {
  const requestorId = _.get(request, 'requestor');
  const requestor = companies.find(c => c._id.equals(requestorId));
  if (_.get(requestor, '_id', null) && !_.isEmpty(requestorId)) {
    request.requestor = {
      _id: requestor._id,
      name: requestor.name,
    };
  }
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const companiesCol = db.collection('companies');
    return companiesCol.find({}, '_id name').toArray()
      .then(companies => requestsCol.find({ requestor: { $ne: null } }).toArray()
        .then((requests) => {
          requests = requests.map((request) => {
            denormalizeRequestor(request, companies);
            return request;
          });
          return Promise.map(
            requests,
            request => requestsCol.updateOne(
              { _id: request._id },
              { $set: { requestor: request.requestor } },
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
