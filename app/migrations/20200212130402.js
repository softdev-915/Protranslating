const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const denormalizeContact = (request, users) => {
  const contactId = _.get(request, 'contact');
  const contact = users.find(u => u._id.equals(contactId));
  if (!_.isEmpty(contactId) && !_.isNil(contact)) {
    request.contact = {
      _id: contact._id,
      email: _.get(contact, 'email', ''),
      middleName: _.get(contact, 'middleName', ''),
      firstName: contact.firstName,
      lastName: contact.lastName,
      projectManagers: _.get(contact, 'projectManagers', []),
      company: _.get(contact, 'company', undefined),
      deleted: _.get(contact, 'deleted', false),
      terminated: _.get(contact, 'terminated', false),
    };
  }
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const usersCol = db.collection('users');
    return usersCol.find({ type: 'Contact' }, '_id email firstName middleName deleted terminated lastName company projectManagers').toArray()
      .then(users => requestsCol.find({ contact: { $ne: null } }).toArray()
        .then((requests) => {
          requests = requests.map((request) => {
            denormalizeContact(request, users);
            return request;
          });
          return Promise.map(
            requests,
            request => requestsCol.updateOne(
              { _id: request._id },
              { $set: { contact: request.contact } },
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
