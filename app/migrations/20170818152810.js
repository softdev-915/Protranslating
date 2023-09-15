const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const workflows = db.collection('workflows');
    const tasks = db.collection('tasks');
    return Promise.all([
      workflows.find({ deleted: true }).toArray(),
    ]).then((deletedWorkflows) => {
      const taskPromises = [];
      deletedWorkflows[0].forEach((workflow) => {
        taskPromises.push(tasks.updateMany({
          workflowId: workflow._id,
        }, {
          $set: {
            deleted: true,
          },
        }));
      });
      return Promise.all(taskPromises);
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
