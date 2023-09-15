const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const WIPODisclaimersJSON = require('./data/20210707094356/wipo-disclaimers.json');
const EPOTranslationFeesJSON = require('./data/20210707094356/epo-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const wipoDisclaimers = db.collection('ip_wipo_disclaimers');
  const epoTranslationFees = db.collection('ip_epo_translation_fees');

  await Promise.map(WIPODisclaimersJSON, c => wipoDisclaimers.findOneAndUpdate({
    country: c.country,
    translationOnly: c.translationOnly,
  }, {
    $set: { codes: c.codes },
  }));
  await Promise.map(EPOTranslationFeesJSON, c => epoTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    agencyFeeFixed: c.agencyFeeFixed,
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
