const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { SCHEDULER_NAME_LAST_RESULT } = require('../utils/custom-query');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  const schedulersCollection = connection.collection('schedulers');
  const lspCollection = connection.collection('lsp');
  const lspPts = await lspCollection.findOne({ name: 'Protranslating' });
  await schedulersCollection.updateOne({ name: SCHEDULER_NAME_LAST_RESULT, lspId: lspPts._id }, {
    $set: {
      'email.template': `
    <p>Custom Query <stong>{{ customQuery.name }}</stong> is ready</p>
    <p>Click <i><a href="{{ host }}/get-file?noIframe=true&url=/api/lsp/{{ customQuery.lspId }}/custom-query/{{ customQuery._id }}/last-result" target="_blank">here</a></i> to download the result</p>
`,
      'email.variables.host': 'https://portal.protranslating.com',
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
