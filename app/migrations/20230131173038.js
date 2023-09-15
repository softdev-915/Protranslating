const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const OLD_COLOR = '#F9CB9C';
const NEW_COLOR = '#c2561a';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    await db.collection('users').updateMany(
      {
        'uiSettings.catUiSettings.inlineUserTags.color': OLD_COLOR,
      },
      {
        $set: { 'uiSettings.catUiSettings.inlineUserTags.color': NEW_COLOR },
      },
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
