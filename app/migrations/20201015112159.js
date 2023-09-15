
const mongo = require('../components/database/mongo');
const _ = require('lodash');
const configuration = require('../components/configuration');
const { getRequestDocuments } = require('../endpoints/lsp/request/request-api-helper');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const stream = requestsCol.find({ 'languageCombinations.0': { $exists: true } }).stream();
    return new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', (request) => {
        if (!_.isEmpty(request.languageCombinations)) {
          stream.pause();
          const sourceDocumentsList = getRequestDocuments(request.languageCombinations);
          const sourceDocuments = sourceDocumentsList.map(s => s.name).join(', ');
          return requestsCol.updateOne(
            { _id: request._id },
            { $set: { sourceDocumentsList: sourceDocuments } })
            .then(() => {
              stream.resume();
            });
        }
        stream.resume();
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
