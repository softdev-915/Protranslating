const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const abilities = db.collection('abilities');
    return abilities.updateMany({}, { $rename: { language: 'languageCombination' } })
      .then(() => abilities.updateMany({ languageCombination: { $exists: false } }, {
        $set: { languageCombination: false },
      }))
      .then(() => abilities.updateMany({ catTool: { $exists: false } }, {
        $set: { catTool: false },
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
