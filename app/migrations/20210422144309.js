const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { SCHEDULER_NAME_LAST_RESULT } = require('../utils/custom-query');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  const schedulersCollection = connection.collection('schedulers');
  const lspList = await connection.collection('lsp').find({
    name: { $in: ['PTI', 'Protranslating'] },
  }).toArray();
  await Promise.map(lspList, async (lsp) => {
    const schedulerRun = {
      name: 'custom-query-run',
      lspId: lsp._id,
      every: '1 minutes',
      options: { lockLifetime: 1e4, priority: 'highest' },
    };
    await schedulersCollection.updateOne(
      { name: schedulerRun.name, lspId: schedulerRun.lspId },
      { $set: schedulerRun },
    );
    const schedulerLastResult = {
      name: SCHEDULER_NAME_LAST_RESULT,
      lspId: lsp._id,
      every: '1 minutes',
      options: { lockLifetime: 1e4, priority: 'highest' },
      email: {
        from: 'support@protranslating.com',
        template: `
    <p>Custom Query <stong>{{ customQuery.name }}</stong> is ready</p>
    <p>Click <i><a href="{{ host }}/get-file?noIframe=true&url=/api/lsp/{{ customQuery.lspId }}/custom-query/{{ customQuery._id }}/last-result">here</a></i> to download the result</p>
`,
        subject: 'Custom Query result ready',
        variables: {
          customQuery: { _id: 'customQueryId', lspId: 'customQueryLspId', name: 'customQueryName' },
          host: 'host',
        },
      },
    };
    await schedulersCollection.updateOne(
      { name: schedulerLastResult.name, lspId: schedulerLastResult.lspId },
      { $set: schedulerLastResult },
    );
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
