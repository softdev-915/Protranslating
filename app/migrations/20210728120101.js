const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const NodbTranslationFeesJSON = require('./data/20210707094356/nodb-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const nodbTranslationFees = db.collection('ip_nodb_translation_fees');

  await Promise.map(NodbTranslationFeesJSON, c => nodbTranslationFees.findOneAndUpdate({
    country: c.country,
  }, { $set: {
    filingIsoCode: c.filingIsoCode,
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
