const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const wipoTranslationFeesJson = require('./data/20230823171528/wipo-translation-fees.json');
const epoTranslationFeesJson = require('./data/20230823171528/epo-translation-fees.json');
const nodbTranslationFeesJson = require('./data/20230823171528/nodb-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const ipRatesCol = db.collection('ipRates');
  const wipoTranslationFeesCollection = db.collection('ip_wipo_translation_fees');
  const epoTranslationFeesCollection = db.collection('ip_epo_translation_fees');
  const nodbTranslationFeesCollection = db.collection('ip_nodb_translation_fees');
  const wipoCountriesCol = db.collection('ip_wipo_countries');
  const wipoIQCountriesToBeMovedToCustomCountries = ['Algeria', 'Indonesia', 'Philippines'];
  await ipRatesCol.updateMany({ entity: { $in: ['wipo', 'nodb'] } }, {
    $set: { defaultCompanyCurrencyCode: 'USD' },
  });
  await ipRatesCol.updateMany({ entity: 'epo' }, {
    $set: { defaultCompanyCurrencyCode: 'EUR' },
  });
  await wipoTranslationFeesCollection.updateOne(
    { country: 'English Translation' },
    { $set: { currencyCode: 'USD' } },
  );
  await epoTranslationFeesCollection.updateOne(
    { country: 'Switzerland & Liechtenstein' },
    {
      $set: {
        agencyFeeFixed: '125.00',
        currencyCode: 'EUR',
      },
    },
  );
  await nodbTranslationFeesCollection.updateOne(
    { country: 'Germany' },
    { $set: { filingIsoCode: 'GER' } },
  );
  await wipoTranslationFeesCollection.deleteMany(
    { country: { $in: wipoIQCountriesToBeMovedToCustomCountries } },
  );
  await wipoCountriesCol.updateMany(
    { name: { $in: wipoIQCountriesToBeMovedToCustomCountries } },
    { $set: { iq: false } },
  );
  await epoTranslationFeesCollection.updateOne(
    { country: 'Tunisia' },
    {
      $set: {
        agencyFeeFixed: '620.00',
        agencyFeeFormula: null,
        officialFeeFormula: {
          fixedFee: 56,
          formulaProperties: ['numberOfClaims'],
          fixedFeeLimit: 10,
          overLimitFee: 15,
          formula: '(totalPages - fixedFeeLimit) * overLimitFee',
        },
      },
    },
  );
  await epoTranslationFeesCollection.updateOne(
    { country: 'Morocco' },
    {
      $set: {
        agencyFeeFixed: '950',
        agencyFeeFormula: 'agencyFeeFixed + (numberOfClaims > 10 ? (numberOfClaims - 10) * ((65 / usdExchangeRate) * targetCurrencyUsdExchangeRate) : 0) * ((1.2 / usdExchangeRate) * targetCurrencyUsdExchangeRate)',
        officialFeeFormula: {
          fixedFee: 595,
          formulaProperties: ['numberOfClaims'],
          fixedFeeLimit: 10,
          overLimitFee: 47,
          formula: '665 + (numberOfClaims > 10 ? (numberOfClaims - 10) * 53 : 0) * 1.2',
        },
      },
    },
  );
  await nodbTranslationFeesCollection.updateMany(
    { country: { $in: ['France', 'Germany'] } },
    { $set: { translationRate: '0.17' } },
  );
  await nodbTranslationFeesCollection.updateOne(
    { country: 'Italy' },
    { $set: { translationRate: '0.16' } },
  );
  await Promise.map(wipoTranslationFeesJson, fee =>
    wipoTranslationFeesCollection.findOneAndUpdate({
      country: fee.country,
    }, { $set: { translationFormula: fee.translationFormula } }),
  );
  await Promise.map(nodbTranslationFeesJson, fee =>
    nodbTranslationFeesCollection.findOneAndUpdate({
      country: fee.country,
    }, { $set: { translationFormula: fee.translationFormula } }),
  );
  await Promise.map(epoTranslationFeesJson, fee =>
    epoTranslationFeesCollection.findOneAndUpdate({
      country: fee.country,
    }, {
      $set: {
        deTranslationFormula: fee.deTranslationFormula,
        enTranslationFormula: fee.enTranslationFormula,
        frTranslationFormula: fee.frTranslationFormula,
        agencyFeeFormula: fee.agencyFeeFormula,
      },
    }),
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
