const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requests = db.collection('requests');
    return requests.find().toArray()
      .then((dbRequests) => {
        const promises = [];
        dbRequests.forEach((request) => {
        // push the function only if the request prop is not defined or empty array
        // avoid index lsp_no where no is null
          if ((typeof request.no !== 'undefined' && request.no !== null) &&
          (typeof request.bucketPrefixes === 'undefined' || request.bucketPrefixes.length === 0)) {
          // take the existing value or create empty array
            request.bucketPrefixes = request.bucketPrefixes || [];
            // try to fill pushing bucket prefix
            const newPrefix = `${request.lspId}/request_files/${request.company}/${request._id}/`;
            // objects ids will call toString while being appended
            request.bucketPrefixes.push(newPrefix);

            // eslint-disable-next-line arrow-body-style
            promises.push(() => {
              return requests.update({ _id: request._id },
                { $set: { bucketPrefixes: request.bucketPrefixes } });
            });
          }
        });
        // Patch all requets
        return Promise.mapSeries(promises, f => f());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
