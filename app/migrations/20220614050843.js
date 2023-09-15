const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const WIPODisclaimersJSON = require('./data/20210707094356/wipo-disclaimers.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const wipoDisclaimers = db.collection('ip_wipo_disclaimers');

  await Promise.map(WIPODisclaimersJSON, c => wipoDisclaimers.findOneAndUpdate({
    country: c.country,
    translationOnly: c.translationOnly,
  }, { $set: {
    country: c.country,
    codes: c.codes,
    sameTranslation: c.sameTranslation,
    disclaimer: c.disclaimer,
    rule: c.rule,
    translationOnly: c.translationOnly,
    translationAndFilling: c.translationAndFilling,
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
