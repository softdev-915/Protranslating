const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const mtEngines = db.collection('mtEngines');
  const mtProviders = db.collection('mtProviders');
  const users = db.collection('users');
  const groups = db.collection('groups');
  const roles = db.collection('roles');

  await mtEngines.updateMany(
    { mtProvider: 'Portal MT' },
    { $set: { mtProvider: 'Portal Translator' } },
  );
  await mtProviders.updateMany(
    { name: 'Portal MT' },
    { $set: { name: 'Portal Translator' } },
  );

  const collections = {
    users,
    groups,
    roles,
  };
  return addNewRole(['MT-TRANSLATOR_READ_COMPANY'], [], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
