const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const LSP_NAME = 'Protranslating';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const catTools = db.collection('catTool');
    const lsp = db.collection('lsp');
    return lsp.findOne({ name: LSP_NAME })
      .then(protranslating => catTools.update({}, {
        $set: { lspId: protranslating._id },
      }, { multi: true }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
