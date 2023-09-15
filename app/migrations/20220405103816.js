const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const EPOClaimsTranslationFeesJSON = require('./data/20220310123746/epo-claims-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const epoClaimsTranslationFees = db.collection('ipEpoClaimsTranslationFees');
  await Promise.map(EPOClaimsTranslationFeesJSON, c => epoClaimsTranslationFees.findOneAndUpdate({
    sourceLanguageIsoCode: c.sourceLanguage,
    targetLanguageIsoCode: c.targetLanguage,
  }, { $set: {
    formula: c.formula,
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
