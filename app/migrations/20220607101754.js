const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const pdfToMtRecognitionScheduler = {
  name: 'auto-pdf-to-mt-text-translation',
  every: '* * * * *',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};

const insertOrUpdate = (schedulersCol, scheduler) => schedulersCol.findOne({ name: scheduler.name, lspId: scheduler.lspId })
  .then((dbScheduler) => {
    if (!dbScheduler) {
      return schedulersCol.insertOne(scheduler);
    }

    return schedulersCol.updateOne({ name: scheduler.name }, { $set: scheduler });
  });

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulerCol = db.collection('schedulers');

    return lspCol.find({})
      .toArray()
      .then((lsps) => Promise.mapSeries(lsps, async ({ _id }) => {
        const recognitionScheduler = { ...pdfToMtRecognitionScheduler };

        recognitionScheduler.lspId = _id;
        await insertOrUpdate(schedulerCol, recognitionScheduler);
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
