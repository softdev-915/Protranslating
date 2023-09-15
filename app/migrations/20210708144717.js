const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const WIPOCountriesJSON = require('./data/20210707094356/wipo-countries.json');
const EPOCountriesJSON = require('./data/20210707094356/epo-countries.json');
const NoDBCountriesJSON = require('./data/20210707094356/nodb-countries.json');
const NODBDisclaimersJSON = require('./data/20210707094356/nodb-disclaimers.json');
const NODBTranslationFeesJSON = require('./data/20210707094356/nodb-translation-fees.json');
const IPCurrenciesJSON = require('./data/20210707094356/ip-currencies.json');
const EPOTranslationFeesJSON = require('./data/20210707094356/epo-translation-fees.json');
const WIPOTranslationFeesJSON = require('./data/20210707094356/wipo-translation-fees.json');
const WIPODisclaimersJSON = require('./data/20210707094356/wipo-disclaimers.json');
const EPODisclaimersJSON = require('./data/20210707094356/epo-disclaimers.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const lsp = db.collection('lsp');
  const wipoCountries = db.collection('ip_wipo_countries');
  const epoCountries = db.collection('ip_epo_countries');
  const nodbCountries = db.collection('ip_nodb_countries');
  const nodbTranslationFees = db.collection('ip_nodb_translation_fees');
  const nodbDisclaimers = db.collection('ip_nodb_disclaimers');
  const ipCurrencies = db.collection('ip_currencies');
  const epoTranslationFees = db.collection('ip_epo_translation_fees');
  const wipoTranslationFees = db.collection('ip_wipo_translation_fees');
  const wipoDisclaimers = db.collection('ip_wipo_disclaimers');
  const epoDisclaimers = db.collection('ip_epo_disclaimers');
  const bigIp = await lsp.findOne({ name: 'BIG IP' });
  await Promise.map(WIPOCountriesJSON, c => wipoCountries.findOneAndUpdate({
    code: c.code,
  }, { $set: {
    lspId: bigIp._id,
    name: c.name,
    code: c.code,
    iq: c.iq,
    entity: c.entity,
    entitySizes: c.entitySizes,
    inactive: c.inactive,
  } }, { upsert: true }));
  await Promise.map(EPOCountriesJSON, c => epoCountries.findOneAndUpdate({
    code: c.code,
  }, { $set: {
    lspId: bigIp._id,
    name: c.name,
    code: c.code,
    memberState: c.memberState,
    validationState: c.validationState,
    extensionState: c.extensionState,
    inactive: c.inactive,
  } }, { upsert: true }));
  await Promise.map(NoDBCountriesJSON, c => nodbCountries.findOneAndUpdate({
    code: c.code,
  }, { $set: {
    lspId: bigIp._id,
    name: c.name,
    code: c.code,
    iq: c.iq,
    inactive: c.inactive,
    entities: c.entities,
  } }, { upsert: true }));
  await Promise.map(IPCurrenciesJSON, c => ipCurrencies.findOneAndUpdate({
    isoCode: c.isoCode,
    database: c.database,
  }, { $set: {
    lspId: bigIp._id,
    isoCode: c.isoCode,
    database: c.database,
    sign: c.sign,
    default: c.default,
    inactive: c.inactive,
  } }, { upsert: true }));
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
  } }, { upsert: true }));
  await Promise.map(WIPOTranslationFeesJSON, c => wipoTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    lspId: bigIp._id,
    country: c.country,
    filingLanguage: c.filingLanguage,
    translationRate: c.translationRate,
    translationFormula: c.translationFormula,
    agencyFeeFlat: c.agencyFeeFlat,
    officialFeeFormula: c.officialFeeFormula,
    officialFeeFormulaMath: c.officialFeeFormulaMath,
    officialFeeAlsoWrittenAs: c.officialFeeAlsoWrittenAs,
  } }, { upsert: true }));
  await Promise.map(NODBTranslationFeesJSON, c => nodbTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    lspId: bigIp._id,
    country: c.country,
    filingLanguage: c.filingLanguage,
    translationRate: c.translationRate,
    translationFormula: c.translationFormula,
    agencyFeeFlat: c.agencyFeeFlat,
    officialFeeFormula: c.officialFeeFormula,
    officialFeeAlsoWrittenAs: c.officialFeeAlsoWrittenAs,
    currencyIsoCode: c.currencyIsoCode,
    agencyFee: c.agencyFee,
    officialFeeFormulaMath: c.officialFeeFormulaMath,
  } }, { upsert: true }));
  await Promise.map(WIPODisclaimersJSON, c => wipoDisclaimers.findOneAndUpdate({
    country: c.country,
    translationOnly: c.translationOnly,
  }, { $set: {
    lspId: bigIp._id,
    country: c.country,
    codes: c.codes,
    sameTranslation: c.sameTranslation,
    disclaimer: c.disclaimer,
    rule: c.rule,
    translationOnly: c.translationOnly,
    translationAndFilling: c.translationAndFilling,
  } }, { upsert: true }));
  await Promise.map(EPODisclaimersJSON, c => epoDisclaimers.findOneAndUpdate({
    countries: c.countries,
    translationOnly: c.translationOnly,
  }, { $set: {
    lspId: bigIp._id,
    countries: c.countries,
    codes: c.codes,
    filingLanguage: c.filingLanguage,
    sameTranslation: c.sameTranslation,
    disclaimer: c.disclaimer,
    rule: c.rule,
    translationOnly: c.translationOnly,
    translationAndFiling: c.translationAndFiling,
  } }, { upsert: true }));
  await Promise.map(NODBDisclaimersJSON, c => nodbDisclaimers.findOneAndUpdate({
    countries: c.countries,
    translationOnly: c.translationOnly,
  }, { $set: {
    lspId: bigIp._id,
    countries: c.countries,
    codes: c.codes,
    filingLanguage: c.filingLanguage,
    sameTranslation: c.sameTranslation,
    disclaimer: c.disclaimer,
    rule: c.rule,
    translationOnly: c.translationOnly,
    translationAndFiling: c.translationAndFiling,
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
