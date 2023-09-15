const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const envConfig = configuration.environment;
const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const tmDescriptorsCol = db.collection('portalCatTmDescriptors');
  if (envConfig.NODE_ENV === 'PROD') {
    return tmDescriptorsCol.deleteMany({});
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
