const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requests = db.collection('requests');
    const collections = {
      requests,
    };
    return collections.requests.find().toArray()
      .then((dbRequests) => {
        const promises = [];
        dbRequests.forEach((request) => {
        // push the function only if the customer prop is defined
          if (typeof request.customer !== 'undefined') {
            request.company = request.customer;
            delete request.customer;
            // eslint-disable-next-line arrow-body-style
            promises.push(() => {
              return collections.requests.update({ _id: request._id }, request);
            });
          }
        });
        // Patch all requets
        return Promise.resolve(promises).mapSeries(f => f());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
