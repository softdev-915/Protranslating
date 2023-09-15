const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    const requestsCol = db.collection('requests');
    const projection = {
      _id: 1,
      firstName: 1,
      lastName: 1,
      providerConfirmed: 1,
      deleted: 1,
      terminated: 1,
    };
    usersCol.find({}, projection).toArray().then(users =>
      requestsCol.find({ 'workflows.0': { $exists: true } })
        .toArray()
        .then(requests =>
          Promise.mapSeries(requests, (request) => {
            const workflows = _.get(request, 'workflows');
            if (!_.isEmpty(workflows)) {
              workflows.forEach((workflow) => {
                workflow.tasks.forEach((task) => {
                  task.providerTasks.forEach((providerTask) => {
                    const provider = _.get(providerTask, 'provider');
                    if (!_.isEmpty(provider)) {
                      const providerFound = users.find(u => u._id.toString() ===
                        provider.toString());
                      if (!_.isNil(providerFound)) {
                        providerTask.provider = {
                          _id: providerFound._id,
                          name: `${providerFound.firstName} ${providerFound.lastName}`,
                          deleted: providerFound.deleted,
                          terminated: providerFound.terminated,
                          providerConfirmed: providerFound.providerConfirmed,
                        };
                      }
                    }
                  });
                });
              });
              return requestsCol.updateOne({ _id: request._id }, {
                $set: {
                  workflows: workflows,
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
