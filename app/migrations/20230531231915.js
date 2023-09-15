const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const epoTranslationFees = db.collection('ip_epo_translation_fees');
  // write your migration logic here.
  epoTranslationFees.updateMany(
    { country: 'Montenegro' },
    { $set: { officialFilingLanguageIsoCode: 'CNR' } },
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
