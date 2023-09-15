const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requests = db.collection('requests');
    const promises = [
      () => requests.update({ status: 'approved' }, { $set: { status: 'In progress' } }, { multi: true }),
      () => requests.update({ status: 'delivered' }, { $set: { status: 'Delivered' } }, { multi: true }),
      () => requests.update({ status: 'cancelled' }, { $set: { status: 'Cancelled' } }, { multi: true }),
      () => requests.update({ status: 'quotationRequired' }, { $set: { status: 'On Hold' } }, { multi: true }),
      () => requests.update({ status: 'toBeTreated' }, { $set: { status: 'To be processed' } }, { multi: true }),
      () => requests.update({ status: 'waitingForQuote' }, { $set: { status: 'Waiting for Quote' } }, { multi: true }),
      () => requests.update({ status: 'waitingForApproval' }, { $set: { status: 'Waiting for approval' } }, { multi: true }),
    ];
    return Promise.mapSeries(promises, promise => promise());
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
