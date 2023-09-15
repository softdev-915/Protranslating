const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const EPOTranslationFeesJSON = require('./data/20220429131548/epo-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const epoTranslationFees = db.collection('ip_epo_translation_fees');
  const epoDisclaimers = db.collection('ip_epo_disclaimers');
  const languages = db.collection('languages');
  const language = {
    name: 'Montenegrin',
    isoCode: 'MNE',
  };

  await Promise.map(EPOTranslationFeesJSON, c =>
    epoTranslationFees.findOneAndUpdate({
      country: c.country,
    }, {
      $set: {
        officialFilingLanguage: c.officialFilingLanguage,
        officialFilingLanguageIsoCode: c.officialFilingLanguageIsoCode,
        agencyFeeFixed: c.agencyFeeFixed,
        translationRate: c.translationRate,
        translationRateFr: c.translationRateFr,
        translationRateDe: c.translationRateDe,
        officialFeeFormula: c.officialFeeFormula,
      },
    }, { upsert: true }),
  );
  await epoDisclaimers.remove({ countries: ['Serbia', 'Montenegro'] });
  await epoDisclaimers.remove({ countries: ['Serbia', 'Bosnia & Herzegovina', 'Montenegro'] });
  await epoDisclaimers.remove({ countries: ['Bosnia & Herzegovina', 'Montenegro'] });
  await languages.insert(language);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
