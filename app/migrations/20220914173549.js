const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const abilities = [
  { name: 'Auto Scan PDF to MT Translated', languageCombination: true, glAccountNo: 12345 },
  { name: 'Auto Scan PDF to MT Skipped', languageCombination: true, glAccountNo: 12345 },
];

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const abilityCollection = db.collection('abilities');
  const lspCol = db.collection('lsp');
  return lspCol.find({})
    .toArray()
    .then(lsps => Promise.mapSeries(
      lsps,
      lsp => Promise.mapSeries(abilities, (ability) => {
        abilityCollection.findOneAndUpdate(
          { name: ability.name, lspId: lsp._id },
          { $set: { ...ability, lspId: lsp._id } },
          { upsert: true },
        );
      }),
    ));
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
