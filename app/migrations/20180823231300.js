const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const newTaxForms = [
  { name: 'W-8BEN', taxIdRequired: false },
  { name: 'W-8BEN-E', taxIdRequired: false },
  { name: 'W-9', taxIdRequired: true },
  { name: '1099 Eligible', taxIdRequired: true },
];

const taxFormsWithLspId = lspId => newTaxForms.map((tf) => {
  tf.lspId = lspId;
  return tf;
});

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCollection = db.collection('lsp');
    const taxFormsCollection = db.collection('taxForms');
    return lspCollection.findOne({ name: 'Protranslating' })
      .then(lsp => Promise
        .map(taxFormsWithLspId(lsp._id), taxForm => taxFormsCollection
          .update({
            name: taxForm.name,
            lspId: taxForm.lspId,
          }, { $set: taxForm }, { upsert: true }), { concurrency: 1 }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
