const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const denormalizeSalesRep = (request, users) => {
  const salesRepId = _.get(request, 'salesRep');
  const salesRep = users.find(u => u._id.equals(salesRepId));
  if (!_.isEmpty(salesRepId) && !_.isNil(salesRep)) {
    request.salesRep = {
      _id: salesRep._id,
      firstName: salesRep.firstName,
      middleName: salesRep.middleName,
      email: _.get(salesRep, 'email', ''),
      lastName: salesRep.lastName,
      deleted: _.get(salesRep, 'deleted', false),
      terminated: _.get(salesRep, 'terminated', false),
    };
  }
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const usersCol = db.collection('users');
    return usersCol.find({}, '_id email firstName middleName deleted terminated lastName').toArray()
      .then(users => requestsCol.find({ salesRep: { $ne: null } }).toArray()
        .then((requests) => {
          requests = requests.map((request) => {
            denormalizeSalesRep(request, users);
            return request;
          });
          return Promise.map(
            requests,
            request => requestsCol.updateOne(
              { _id: request._id },
              { $set: { salesRep: request.salesRep } },
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
