const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const notificationsCol = db.collection('notifications');
    const lspCol = db.collection('lsp');
    lspCol.findOne({ name: 'Protranslating' }).then((pts) => {
      const bulk = notificationsCol.initializeUnorderedBulkOp();
      bulk.find({}).update({ $set: { lspId: pts._id } });
      return bulk.execute();
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
