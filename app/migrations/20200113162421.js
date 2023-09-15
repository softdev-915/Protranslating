const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // write your migration logic here.
    const requestsCol = db.collection('requests');
    const lastFriday = moment().subtract('3', 'days').startOf('day');
    return requestsCol.find({
      updatedAt: { $gte: lastFriday.toDate() },
      workflows: {
        $exists: true,
        $not: { $size: 0 },
      },
    }).toArray()
      .then((requestsToUpdate) => {
        if (!_.isEmpty(requestsToUpdate)) {
          return Promise.map(requestsToUpdate, (request) => {
            if (!_.isEmpty(request.documents) && !_.isEmpty(request.workflows)) {
              const originalDocumentsLength = request.documents.length;
              request.documents = request.documents.filter((document) => {
                const foundTaskDocument = request.workflows.some(workflow =>
                  workflow.tasks.some(task =>
                    task.providerTasks.some(providerTask =>
                      providerTask.files.some((file) => {
                        const fileDate = moment(file.createdAt, 'YYYY-MM-DDThh:mm:ssZ');
                        const documentDate = moment(document.createdAt, 'YYYY-MM-DDThh:mm:ssZ');
                        return document.final === false &&
                        file.final === false &&
                        document.name === file.name &&
                        document.size === file.size &&
                        fileDate.format('YYYY-MM-DD') === documentDate.format('YYYY-MM-DD');
                      }),
                    ),
                  ),
                );
                return !foundTaskDocument;
              });
              if (request.documents.length !== originalDocumentsLength) {
                return requestsCol.updateOne(
                  { _id: request._id },
                  { $set: { documents: request.documents } },
                );
              }
            }
            return Promise.resolve();
          }, { concurrency: 10 });
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
