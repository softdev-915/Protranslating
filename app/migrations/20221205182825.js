const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const billsCol = db.collection('bills');
    const billStream = billsCol.find({}, { requests: 1, providerTaskIds: 1 }).stream();
    return new Promise((resolve, reject) => {
      billStream.on('end', resolve);
      billStream.on('error', reject);
      billStream.on('data', (bill) => {
        const requestIds = bill.requests.map(r => r._id);
        billStream.pause();
        try {
          if (bill.requests.length > 0 && bill.providerTaskIds.length > 0) {
            const arrayFilters = [{
              'providerTask._id': { $in: bill.providerTaskIds },
            }];
            return requestsCol.updateMany({
              _id: { $in: requestIds },
            }, {
              $set: {
                'workflows.$[].tasks.$[].providerTasks.$[providerTask].billed': true,
              },
            }, { arrayFilters })
              .finally(() => billStream.resume());
          }
        // eslint-disable-next-line no-empty
        } catch (error) {
        } finally {
          billStream.resume();
        }
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
