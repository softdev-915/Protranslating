const moment = require('moment');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const DEFAULT_DATE = moment.utc('2018-01-01', 'YYYY-MM-DD').toDate();
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requests = db.collection('requests');
    return requests.update({ status: 'delivered' }, { $set: { completedAt: DEFAULT_DATE } })
      .then(() => requests.update({ status: 'cancelled' }, { $set: { cancelledAt: DEFAULT_DATE } }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
