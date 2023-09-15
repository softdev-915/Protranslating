const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const WIPOTranslationFeesJSON = require('./data/20210707094356/wipo-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const wipoTranslationFees = db.collection('ip_wipo_translation_fees');

  await Promise.map(WIPOTranslationFeesJSON, c => wipoTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    filingLanguageIso: c.filingLanguageIso,
  } }));
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

