const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const _ = require('lodash');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    let ptsLsp;
    let ptsSchedulers;
    // Set current PTS lspId in existing schedulers
    return lspCol.findOne({ name: 'Protranslating' })
      .then((pts) => {
        ptsLsp = pts;
        return schedulersCol.update({
          lspId: {
            $exists: false,
          },
        },
        { $set: { lspId: pts._id } },
        { multi: true },
        );
      })
      .then(() => schedulersCol.find({ lspId: ptsLsp._id }).toArray().then((schedulers) => {
        const schedulersToCopy = [
          'forgotPassword',
          'backup-notifications-monthly',
          'quoted-request-creation-pm-email',
          'quote-client-approved-pm-email',
          'service-to-do-provider-notification',
          'backup-audit-db-monthly',
          'request-creation-pm-email',
          'document-retention-policy',
          'bill-paid-provider',
          'bill-pending-approval-provider',
          'competence-audit-create',
          'competence-audit-update',
          'contact-us-notification',
          'inactivate-user',
          'provider-availability-email',
          'quote-pending-approval-contact',
          'request-completed-email',
          'request-creation-email',
          'request-modified-pm-email',
          'service-to-do-provider-conference',
          'service-to-do-provider-consecutive',
          'user-feedback-create-for-auditor',
          'user-feedback-update-for-auditor',
          'bill-flat-rate',
          'bill-invoice-per-period',
          'bill-paid-provider',
          'bill-variable-rate',
          'custom-query-last-result',
          'custom-query-run',
          'si-connector',
        ];
        ptsSchedulers = schedulers.filter(s => schedulersToCopy.indexOf(s.name) >= 0);
        return ptsSchedulers;
      }))
      .then(() => lspCol.findOne({ name: 'US Bank' }).then((usBank) => {
        ptsSchedulers = ptsSchedulers.map((scheduler) => {
          const newScheduler = _.assign({}, scheduler);
          delete newScheduler._id;
          newScheduler.lspId = usBank._id;
          return newScheduler;
        });
        return Promise.mapSeries(ptsSchedulers, s =>
          schedulersCol.findOne({ name: s.name, lspId: usBank._id })
            .then((scheduler) => {
              if (!scheduler) {
                return schedulersCol.insertOne(s);
              }
            }),
        );
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
