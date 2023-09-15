const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const processRequest = async (request) => {
  await Promise.map(request.workflows, async (workflow) => {
    if (_.isNil(workflow.updatedAt)) {
      workflow.updatedAt = request.updatedAt;
    }
    if (_.isNil(workflow.createdAt)) {
      workflow.createdAt = request.updatedAt;
    }
  });
};

const hasWorkflowWithEmptyUpdatedAt = request =>
  request.workflows.some(workflow => _.isNil(workflow.updatedAt) || _.isNil(workflow.createdAt));

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const requestsCol = db.collection('requests');
  const stream = requestsCol.find({
    workflows: {
      $exists: true,
      $not: { $size: 0 },
    },
  }).stream();
  stream.on('error', (err) => {
    throw err;
  });
  stream.on('data', async (request) => {
    if (!hasWorkflowWithEmptyUpdatedAt(request)) {
      return;
    }
    stream.pause();
    try {
      await processRequest(request);
      await requestsCol.updateOne(
        { _id: request._id },
        { $set: { workflows: request.workflows } },
        { timeStamps: false },
      );
    } catch (e) {
      console.log(`Error ocurred ${e}`);
    }
    stream.resume();
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
