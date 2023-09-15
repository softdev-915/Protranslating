const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const fiveMinSchedulers = [
  'custom-query-last-result',
  'custom-query-run',
  'customizedquote-completed-email',
  'provider-availability-email',
  'quote-client-approved-pm-email',
  'quote-pending-approval-contact',
  'quoted-request-creation-pm-email',
  'request-completed-email',
  'request-creation-email',
  'request-creation-pm-email',
  'request-modified-pm-email',
  'requesting-customized-quote-email',
  'requesting-quote-email',
  'service-to-do-provider-conference',
  'service-to-do-provider-notification',
  'service-to-do-provider-consecutive',
  'user-feedback-create-for-auditor',
  'user-feedback-update-for-auditor',
];

const oneMinSchedulers = [
  'auto-pdf-to-mt-text-recognition',
  'auto-pdf-to-mt-text-translation',
  'forgotPassword',
];

const sixtyMinSchedulers = [
  'bill-variable-rate',
  'bill-paid-provider',
];

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const schedulersCol = db.collection('schedulers');
  await Promise.map(fiveMinSchedulers, (scheduler) => {
    let frequencyInSeconds = 300; // 5 minutes
    return schedulersCol.find({ name: scheduler }).toArray().then(schedulers =>
      Promise.map(schedulers, (dbScheduler) => {
        frequencyInSeconds += Math.floor(Math.random() * (30)) + 1;
        return schedulersCol.findOneAndUpdate(
          { _id: dbScheduler._id },
          { $set: { every: `${frequencyInSeconds} seconds` },
          });
      }),
    );
  });
  await Promise.map(oneMinSchedulers, (scheduler) => {
    let frequencyInSeconds = 60;
    return schedulersCol.find({ name: scheduler }).toArray().then(schedulers =>
      Promise.map(schedulers, (dbScheduler) => {
        frequencyInSeconds += Math.floor(Math.random() * (15)) + 1;
        return schedulersCol.findOneAndUpdate(
          { _id: dbScheduler._id },
          { $set: { every: `${frequencyInSeconds} seconds` },
          });
      }),
    );
  });
  await Promise.map(sixtyMinSchedulers, (scheduler) => {
    let frequencyInMinutes = 45;
    return schedulersCol.find({ name: scheduler }).toArray().then(schedulers =>
      Promise.map(schedulers, (dbScheduler) => {
        frequencyInMinutes += Math.floor(Math.random() * (9)) + 1;
        return schedulersCol.findOneAndUpdate(
          { _id: dbScheduler._id },
          { $set: { every: `${frequencyInMinutes} minutes` },
          });
      }),
    );
  });
  return schedulersCol.remove({ name: 'EOP' });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
