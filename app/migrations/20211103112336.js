const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const EPOTranslationFeesJSON = require('./data/20210707094356/epo-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const epoTranslationFees = db.collection('ip_epo_translation_fees');

  await Promise.map(EPOTranslationFeesJSON, c => epoTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    officialFeeFormula: c.officialFeeFormula,
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
