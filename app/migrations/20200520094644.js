const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const DEFAULT_QA_WARNING_MESSAGES_COLOR = '#F6B26B';
const DEFAULT_QA_ERROR_MESSAGES_COLOR = '#FF0000';
const DEFAULT_INLINE_USER_TAGS_COLOR = '#F9CB9C';
const DEFAULT_INLINE_SYSTEM_TAGS_COLOR = '#0000FF';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    await db.collection('companies').updateMany({}, { $set: { 'pcSettings.mtThreshold': 75 } });
    await db.collection('users').updateMany({}, { $set: { uiSettings: {
      catUiSettings: {
        inlineUserTags: {
          color: DEFAULT_INLINE_USER_TAGS_COLOR,
        },
        inlineSystemTags: {
          color: DEFAULT_INLINE_SYSTEM_TAGS_COLOR,
        },
        qaErrorMessages: {
          color: DEFAULT_QA_ERROR_MESSAGES_COLOR,
        },
        qaWarningMessages: {
          color: DEFAULT_QA_WARNING_MESSAGES_COLOR,
        },
      },
    } } });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
