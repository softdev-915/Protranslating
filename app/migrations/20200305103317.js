const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    return requestsCol.find({ 'documents.md5Hash': 'pending' })
      .toArray()
      .then(requests =>
        Promise.map(requests, (request) => {
          const documents = _.get(request, 'documents', []);
          documents.forEach((document) => {
            if (document.md5Hash === 'pending') {
              document.md5Hash = 'default';
            }
          });
          if (documents.length > 0) {
            return requestsCol.updateOne({ _id: request._id }, {
              $set: {
                documents: documents,
              },
            });
          }
        }, { concurrency: 100 }),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
