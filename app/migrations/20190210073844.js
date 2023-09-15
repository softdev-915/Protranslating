const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const abilities = [
  { name: 'Simultaneous Court Interpretation', languageCombination: true },
  { name: 'Simultaneous Conference Interpretation', languageCombination: true },
  { name: 'Voice Talent', languageCombination: true },
  { name: 'Requestor Confirmation', languageCombination: false },
  { name: 'Technician', languageCombination: false },
  { name: 'Equipment Provider', languageCombination: false },
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const abilitiesCollection = db.collection('abilities');
    const lspCollection = db.collection('lsp');
    return lspCollection.findOne({ name: 'PTI' })
      .then((ptiLsp => Promise.all(abilities.map(a => abilitiesCollection.findOneAndUpdate(
        { name: a.name, lspId: _.get(ptiLsp, '_id') },
        { $set: { languageCombination: a.languageCombination } },
        { upsert: true },
      )))));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
