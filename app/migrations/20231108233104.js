const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const mtEngines = db.collection('mtEngines');
  const mtProviders = db.collection('mtProviders');

  await mtEngines.updateMany(
    { mtProvider: 'Portal Translator' },
    { $set: { mtProvider: 'Portal MT' } },
  );
  await mtProviders.updateMany(
    { name: 'Portal Translator' },
    { $set: { name: 'Portal MT' } },
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
