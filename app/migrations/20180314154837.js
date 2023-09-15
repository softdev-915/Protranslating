const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    const activityTags = db.collection('activityTags');
    const competenceLevels = db.collection('competenceLevels');
    const lspName = 'Protranslating';
    let lspId;
    return lsp.findOne({ name: lspName })
      .then((protranslating) => {
        lspId = protranslating._id;
        return lspId;
      })
      .then(() => activityTags.update({
        lspId: {
          $exists: false,
        },
      }, {
        $set: {
          lspId,
        },
      }, { multi: true }))
      .then(() => competenceLevels.update({
        lspId: {
          $exists: false,
        },
      }, {
        $set: {
          lspId,
        },
      }, { multi: true }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
