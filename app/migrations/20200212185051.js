const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const denormalizeRequestProjectManagers = (request, projectManagers) => {
  const requestProjectManagers = _.get(request, 'projectManagers', []);
  return requestProjectManagers.map((pm) => {
    const projectManager = projectManagers.find(c => c._id.equals(pm._id));
    if (projectManager) {
      return {
        _id: projectManager._id,
        email: _.get(projectManager, 'email', ''),
        middleName: _.get(projectManager, 'middleName', ''),
        firstName: projectManager.firstName,
        lastName: projectManager.lastName,
        deleted: _.get(projectManager, 'deleted', false),
        terminated: _.get(projectManager, 'terminated', false),
      };
    }
    return projectManager;
  });
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const usersCol = db.collection('users');
    return usersCol.find({}, '_id firstName middleName lastName email deleted terminated').toArray()
      .then(projectManagers => requestsCol.find({ projectManagers: { $ne: null } }).toArray()
        .then((requests) => {
          requests = requests.map((request) => {
            request.projectManagers = denormalizeRequestProjectManagers(request, projectManagers);
            return request;
          });
          return Promise.map(
            requests,
            request => requestsCol.updateOne(
              { _id: request._id },
              { $set: { projectManagers: request.projectManagers } },
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
