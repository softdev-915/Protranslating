const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const NODBTranslationFeesJSON = require('./data/20210707094356/nodb-translation-fees.json');
const EPOTranslationFeesJSON = require('./data/20210707094356/epo-translation-fees.json');
const WIPOTranslationFeesJSON = require('./data/20210707094356/wipo-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const nodbTranslationFees = db.collection('ip_nodb_translation_fees');
  const epoTranslationFees = db.collection('ip_epo_translation_fees');
  const wipoTranslationFees = db.collection('ip_wipo_translation_fees');
  await Promise.map(EPOTranslationFeesJSON, c => epoTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    agencyFeeFixed: c.agencyFeeFixed,
    translationRate: c.translationRate,
    translationRateFr: c.translationRateFr,
    translationRateDe: c.translationRateDe,
    currencyCode: c.currencyCode,
  } }, { upsert: true }));
  await Promise.map(WIPOTranslationFeesJSON, c => wipoTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    translationRate: c.translationRate,
    agencyFeeFlat: c.agencyFeeFlat,
    currencyCode: c.currencyCode,
  } }, { upsert: true }));
  await Promise.map(NODBTranslationFeesJSON, c => nodbTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    currencyCode: c.currencyCode,
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
