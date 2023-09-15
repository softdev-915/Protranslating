const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const removeUseSsessionsScheduler = lspId => ({
  name: 'remove-user-sessions',
  every: '*/5 * * * *',
  options: {
    lockLifetime: 10000,
    priority: 'low',
  },
  lspId,
});

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    return lspCol.find().toArray().then(lsps => Promise.all(lsps.map((lsp) => {
      const lspId = lsp._id;
      const s = removeUseSsessionsScheduler(lspId);
      return schedulersCol.updateOne({ name: s.name, lspId }, { $set: s }, { upsert: true });
    })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
