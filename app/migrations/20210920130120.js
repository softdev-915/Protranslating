const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const epoCountries = db.collection('ip_epo_countries');
  const NORWAY_COUNTRY_NAME = 'Norway';
  const NORWAY_ISO_CODE = 'NO';
  await epoCountries.findOneAndUpdate({
    name: NORWAY_COUNTRY_NAME,
  }, {
    $set: {
      code: NORWAY_ISO_CODE,
    },
  });
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
