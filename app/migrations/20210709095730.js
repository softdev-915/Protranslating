const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const EPOTranslationFeesJSON = require('./data/20210707094356/epo-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const lsp = db.collection('lsp');
  const epoTranslationFees = db.collection('ip_epo_translation_fees');
  const bigIp = await lsp.findOne({ name: 'BIG IP' });

  await Promise.map(EPOTranslationFeesJSON, c => epoTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    lspId: bigIp._id,
    country: c.country,
    officialFilingLanguage: c.officialFilingLanguage,
    agencyFeeFixed: c.agencyFeeFixed,
    translationRate: c.translationRate,
    enTranslationFormula: c.enTranslationFormula,
    deTranslationFormula: c.deTranslationFormula,
    frTranslationFormula: c.frTranslationFormula,
    deEngTranslationOfDescriptionRequired: c.deEngTranslationOfDescriptionRequired,
    frEngTranslationOfDescriptionRequired: c.frEngTranslationOfDescriptionRequired,
    officialFeeFormula: c.officialFeeFormula,
  } }, { upsert: true }));
};
if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => {
      throw err;
    });
} else {
  module.exports = migration;
}

