const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const scheduler = {
  name: 'bill-monthly-vendor',
  every: '0 0 * * *',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    return lspCol.find({}).toArray().then(lsps => Promise.mapSeries(lsps, (lsp) => {
      scheduler.lspId = lsp._id;
      return schedulersCol.findOne({ name: scheduler.name, lspId: lsp._id })
        .then((schedulerInDb) => {
          if (!_.isNil(schedulerInDb)) {
            return schedulersCol.updateOne(
              { _id: schedulerInDb._id },
              { $set: { email: scheduler.email },
              });
          }
        });
    }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
