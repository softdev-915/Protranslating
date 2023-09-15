const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const { copyCollectionRecordsToLsp } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const collections = [
      'catTool',
      'leadSources',
      'activityTags',
      'billingTerms',
      'fuzzyMatches',
      'paymentMethods',
      'translationUnits',
      'competenceLevels',
      'abilities',
      'currencies',
      'certifications',
      'deliveryMethods',
      'documentTypes',
      'groups',
      'internalDepartments',
      'languages',
      'locations',
      'quoteTemplates',
      'schedulingStatuses',
      'requestTypes',
      'softwareRequirements',
      'taxForms',
      'lsp',
      'transactionTypes',
    ];
    return Promise.mapSeries(collections, (c) => {
      const currentCol = db.collection(c);
      return copyCollectionRecordsToLsp(lspCol, 'Protranslating', 'Big IP', currentCol);
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
