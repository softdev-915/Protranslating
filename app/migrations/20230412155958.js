const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const EPOTranslationFeesJSON = require('./data/20230412155958/epo-translation-fees.json');
const WIPOTranslationFeesJSON = require('./data/20230412155958/wipo-translation-fees.json');
const EPOClaimsTranslationFeesJSON = require('./data/20230412155958/epo-claims-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const epoTranslationFees = db.collection('ip_epo_translation_fees');
  const wipoTranslationFees = db.collection('ip_wipo_translation_fees');
  const epoCountries = db.collection('ip_epo_countries');
  const wipoCountries = db.collection('ip_wipo_countries');
  const wipoDisclaimers = db.collection('ip_wipo_disclaimers');
  const epoDisclaimers = db.collection('ip_epo_disclaimers');
  const epoClaimsTranslationFees = db.collection('ipEpoClaimsTranslationFees');
  const EPODisclaimersJSON = [
    {
      countries: ['ALL'],
      codes: [],
      filingLanguage: '',
      sameTranslation: false,
      disclaimer: 'The above estimate does not include fees that may be incurred for extensions, late filing of formal documents, maintenance fees, or sequence listings. All word, page and claim counts are extracted from European Patent Office (EPO) data and can be amended at the Patent Details step. Text from images and figures may not have been taken into consideration in the word counts.',
      rule: '',
      translationOnly: false,
      translationAndFiling: true,
    },
  ];

  const WIPODisclaimersJSON = [
    {
      country: 'ALL',
      codes: [],
      sameTranslation: false,
      disclaimer: 'The above estimate does not include fees that may be incurred for extensions, late filings of formal documents, maintenance fees, amendments, or sequence listing. All word, page, claim, and priority application counts are extracted from World Intellectual Property Organization (WIPO) data, and can be manually amended at the Patent Details step. Text from images and figures may not have been taken into consideration in the word counts.',
      rule: '',
      translationOnly: false,
      translationAndFilling: true,
    },
    {
      country: 'Japan',
      codes: ['JP'],
      sameTranslation: false,
      disclaimer: 'Japan: The translation fee does not include the fee for the number of figures, images and tables in the application, each of which is charged at $4 per figure/image/table.',
      rule: 'Show this disclaimer if Japan is selected',
      translationOnly: true,
      translationAndFilling: false,
    },
  ];

  // Update EPO Translation Fees
  await Promise.map(EPOTranslationFeesJSON, c =>
    epoTranslationFees.findOneAndUpdate({
      country: c.country,
    }, {
      $set: {
        agencyFeeFixed: c.agencyFeeFixed,
        agencyFeeFormula: c.agencyFeeFormula,
        translationRate: c.translationRate,
        translationRateFr: c.translationRateFr,
        translationRateDe: c.translationRateDe,
        enTranslationFormula: c.enTranslationFormula,
        deTranslationFormula: c.deTranslationFormula,
        frTranslationFormula: c.frTranslationFormula,
        deEngTranslationOfDescriptionRequired: c.deEngTranslationOfDescriptionRequired,
        frEngTranslationOfDescriptionRequired: c.frEngTranslationOfDescriptionRequired,
        officialFeeFormula: c.officialFeeFormula,
      },
    }, { upsert: true }),
  );

  // Update WIPO Translation Fees
  await Promise.map(WIPOTranslationFeesJSON, c =>
    wipoTranslationFees.findOneAndUpdate({
      country: c.country,
    }, {
      $set: {
        translationRate: c.translationRate,
        translationFormula: c.translationFormula,
        agencyFeeFlat: c.agencyFeeFlat,
        agencyFeeFormula: c.agencyFeeFormula,
        officialFeeFormula: c.officialFeeFormula,
        officialFeeFormulaMath: c.officialFeeFormulaMath,
      },
    }, { upsert: true }),
  );

  // Update EPO Claims Translation Fees
  await Promise.map(EPOClaimsTranslationFeesJSON, c => epoClaimsTranslationFees.findOneAndUpdate({
    sourceLanguageIsoCode: c.sourceLanguage,
    targetLanguageIsoCode: c.targetLanguage,
  }, { $set: {
    formula: c.formula,
  } }, { upsert: true }));

  // Update EPO disclaimer
  await Promise.map(EPODisclaimersJSON, c => epoDisclaimers.findOneAndUpdate({
    countries: c.countries,
    translationOnly: c.translationOnly,
  }, { $set: {
    disclaimer: c.disclaimer,
  } }, { upsert: true }));

  // Update WIPO disclaimer
  await Promise.map(WIPODisclaimersJSON, c => wipoDisclaimers.findOneAndUpdate({
    country: c.country,
    translationOnly: c.translationOnly,
  }, { $set: {
    codes: c.codes,
    sameTranslation: c.sameTranslation,
    disclaimer: c.disclaimer,
    rule: c.rule,
    translationAndFilling: c.translationAndFilling,
    translationOnly: c.translationOnly,
  } }, { upsert: true }));

  // Delete EPO Countries: Dominican Republic, Guatemala, Panama
  await epoCountries.deleteMany({ name: { $in: ['Dominican Republic', 'Guatemala', 'Panama'] } });
  // Delete WIPO Countries: Dominican Republic, Guatemala, Panama, Hong Kong
  await wipoCountries.deleteMany({ name: { $in: ['Dominican Republic', 'Guatemala', 'Panama', 'Hong Kong', 'Tunisia'] } });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
