const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const invoicePosterScheduler = {
  name: 'invoice-poster',
  every: '30 seconds',
  isRunning: false,
  email: {
    from: 'support@protranslating.com',
  },
};

const insertOrUpdate = (schedulersCol, scheduler) =>
  schedulersCol.findOne({ name: scheduler.name, lspId: scheduler.lspId })
    .then((dbScheduler) => {
      if (!dbScheduler) {
        return schedulersCol.insertOne(scheduler);
      }
      return schedulersCol.updateOne({ name: scheduler.name }, { $set: scheduler });
    });

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const schedulersCol = db.collection('schedulers');
  const lspCol = await db.collection('lsp').find().toArray();
  return Promise.mapSeries(lspCol, async ({ _id }) => {
    const scheduler = Object.assign({}, invoicePosterScheduler);
    scheduler.lspId = _id;
    return insertOrUpdate(schedulersCol, scheduler);
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
