const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const denormalizeRequestorContact = (request, users) => {
  const requestorContactId = _.get(request, 'requestorContact');
  const requestorContact = users.find(u => u._id.equals(requestorContactId));
  if (!_.isEmpty(requestorContactId) && !_.isNil(requestorContact)) {
    request.requestorContact = {
      _id: requestorContact._id,
      email: _.get(requestorContact, 'email', ''),
      middleName: _.get(requestorContact, 'middleName', ''),
      firstName: requestorContact.firstName,
      lastName: requestorContact.lastName,
      deleted: _.get(requestorContact, 'deleted', false),
      terminated: _.get(requestorContact, 'terminated', false),
    };
  }
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const usersCol = db.collection('users');
    return usersCol.find({ type: 'Contact' }, '_id firstName middleName lastName email deleted terminated').toArray()
      .then(users => requestsCol.find({ requestorContact: { $ne: null } }).toArray()
        .then((requests) => {
          requests = requests.map((request) => {
            denormalizeRequestorContact(request, users);
            return request;
          });
          return Promise.map(
            requests,
            request => requestsCol.updateOne(
              { _id: request._id },
              { $set: { requestorContact: request.requestorContact } },
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
