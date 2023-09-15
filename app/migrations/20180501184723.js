const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

let newBillingTerms = [
  { name: '2/10 Net 45' },
  { name: '2/10 Net 60' },
  { name: 'Due on receipt' },
  { name: 'Net 7' },
  { name: 'Net 10' },
  { name: 'Net 15' },
  { name: 'Net 20' },
  { name: 'Net 25' },
  { name: 'Net 30' },
  { name: 'Net 45' },
  { name: 'Net 60' },
  { name: 'Net 90' },
];
const insertIfMissing = (billingTerms, newBillingTerm) =>
  billingTerms.findOne({
    name: newBillingTerm.name,
    lspId: newBillingTerm.lspId,
  })
    .then((billingTerm) => {
      if (!billingTerm) {
        return billingTerms.insert(newBillingTerm);
      }
      return billingTerms.update({
        name: newBillingTerm.name,
        lspId: newBillingTerm.lspId,
      }, {
        $set: newBillingTerm,
      });
    });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Protranslating' }).then((lsp) => {
      newBillingTerms = newBillingTerms.map(billingTerm => ({
        name: billingTerm.name,
        lspId: lsp._id,
      }));

      const billingTermsCollection = db.collection('billingTerms');
      return Promise.mapSeries(newBillingTerms, billingTerm =>
        insertIfMissing(billingTermsCollection, billingTerm));
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
