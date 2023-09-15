const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    let ptsSchedulers;
    let bigEurSchedulers;
    // Set current PTS lspId in existing schedulers
    return lspCol.findOne({ name: 'Protranslating' })
      .then(pts =>
        schedulersCol.find({ lspId: pts._id }).toArray()
          .then((schedulers) => {
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
              'quote-client-approved-pm-email',
              'quote-pending-approval-contact',
              'request-completed-email',
              'request-creation-email',
              'request-modified-pm-email',
              'service-to-do-provider-conference',
              'service-to-do-provider-consecutive',
              'user-feedback-create-for-auditor',
              'user-feedback-update-for-auditor',
            ];
            ptsSchedulers = schedulers.filter(s => schedulersToCopy.indexOf(s.name) >= 0);
            return ptsSchedulers;
          }),
      )
      // Get new LSP
      .then(() => lspCol.findOne({ name: 'BIG-LS EUR' }).then((bigEur) => {
        bigEurSchedulers = ptsSchedulers.map((scheduler) => {
          const newScheduler = _.assign({}, scheduler);
          delete newScheduler._id;
          newScheduler.lspId = bigEur._id;
          return newScheduler;
        });
        return Promise.mapSeries(bigEurSchedulers, s =>
          schedulersCol.findOne({ name: s.name, lspId: bigEur._id })
            .then((scheduler) => {
              if (_.isNil(scheduler)) {
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
