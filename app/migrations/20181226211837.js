const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    let lspList = [];
    let pts;
    return lspCol.find({}).toArray()
      .then((lsps) => {
        if (lsps && lsps.length === 2) {
          lspList = lsps;
          pts = lspList.find(lsp => lsp.name === 'Protranslating');
          // Add lspId to scheduler (if missing)
          return schedulersCol.updateOne({
            name: 'provider-availability-email',
            lspId: {
              $exists: false,
            },
          },
          { $set: { lspId: pts._id } },
          );
        }
      })
      .then(() => {
        if (lspList.length === 2) {
          if (pts) {
            return schedulersCol.findOne({
              name: 'provider-availability-email',
              lspId: pts._id,
            });
          }
        }
      })
      .then((ptsScheduler) => {
        if (lspList.length === 2) {
          const pti = lspList.find(lsp => lsp.name === 'PTI');
          if (pti) {
            return schedulersCol.findOne({
              name: 'provider-availability-email',
              lspId: pti._id,
            })
              .then((schedulerFound) => {
                if (!schedulerFound) {
                  delete ptsScheduler._id;
                  ptsScheduler.lspId = pti._id;
                  // Duplicate ptsScheduler for PTI
                  return schedulersCol.insertOne(ptsScheduler);
                }
              });
          }
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
