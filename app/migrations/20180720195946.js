const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const abilityCollection = db.collection('abilities');
    return abilityCollection.findOneAndUpdate({
      name: 'Sales Rep',
    }, {
      $setOnInsert: { name: 'Sales Rep', catTool: false, languageCombination: false },
    }, {
      upsert: true,
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
