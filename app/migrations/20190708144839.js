const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const ptiAbilities = [
  'Simultaneous Court Interpretation',
  'Simultaneous Conference Interpretation',
  'RSI Interpretation',
  'Option',
  'Voice Talent',
  'Requestor Receipt',
  'Requestor Confirmation',
  'Confirmation of Assignment',
  'Technician',
  'Equipment Provider',
  'Equipment Setup',
  'Equipment Strike',
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCollection = db.collection('lsp');
    const abilitiesCollection = db.collection('abilities');
    return lspCollection.findOne({ name: 'PTI' })
      .then(ptiLsp => abilitiesCollection.remove({
        lspId: _.get(ptiLsp, '_id'),
        name: { $not: { $in: ptiAbilities } },
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
