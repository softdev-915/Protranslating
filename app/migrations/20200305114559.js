const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    return requestsCol.find({ workflows: { $exists: true } })
      .toArray()
      .then(requests =>
        Promise.mapSeries(requests, (request) => {
          const workflows = _.get(request, 'workflows');
          if (!_.isEmpty(workflows)) {
            workflows.forEach((workflow) => {
              workflow.tasks.forEach((task) => {
                task.providerTasks.forEach((providerTask) => {
                  const files = _.get(providerTask, 'files');
                  if (!_.isEmpty(files)) {
                    files.forEach((file) => {
                      if (_.get(file, 'md5Hash') === 'pending') {
                        file.md5Hash = 'default';
                      }
                    });
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
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}

