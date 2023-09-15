const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const WIPOTranslationFeesJSON = require('./data/20220310123748/wipo-translation-fees.json');
const NoDBTranslationFeesJSON = require('./data/20220310123748/wipo-translation-fees.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const wipoTranslationFees = db.collection('ip_wipo_translation_fees');
  const nodbTranslationFees = db.collection('ip_nodb_translation_fees');

  await Promise.map(WIPOTranslationFeesJSON, element => wipoTranslationFees.findOneAndUpdate({
    country: element.country,
  },
  {
    $set: {
      translationRate: element.translationRate,
    },
  }),
  { concurrency: 3 });

  await Promise.map(NoDBTranslationFeesJSON, element => nodbTranslationFees.findOneAndUpdate({
    country: element.country,
  },
  {
    $set: {
      translationRate: element.translationRate,
    },
  }),
  { concurrency: 3 });
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
