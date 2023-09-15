const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

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
    // Duplicate certain schedulers for new LSP
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
        ];
        ptsSchedulers = schedulers.filter(s => schedulersToCopy.indexOf(s.name) >= 0);
        return ptsSchedulers;
      }))
    // Get new LSP
      .then(() => lspCol.findOne({ name: 'PTI' }).then((pti) => {
        ptsSchedulers.forEach((s, index, allSchedulers) => {
          delete s._id;
          s.lspId = pti._id;
          allSchedulers[index] = s;
        });
        return Promise.mapSeries(ptsSchedulers, s =>
          schedulersCol.findOne({ name: s.name, lspId: pti._id })
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
