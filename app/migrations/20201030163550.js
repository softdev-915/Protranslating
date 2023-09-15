const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { SCHEDULER_NAME_LAST_RESULT } = require('../utils/custom-query');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  const schedulersCollection = connection.collection('schedulers');
  const lsp = await connection.collection('lsp').findOne({ name: 'PTI' });
  const schedulerRun = {
    name: 'custom-query-run',
    lspId: lsp._id,
    every: '1 minutes',
    options: { lockLifetime: 1e4, priority: 'highest' },
  };
  await schedulersCollection.updateOne({
    name: schedulerRun.name, lspId: schedulerRun.lspId,
  }, {
    $set: schedulerRun,
  }, {
    upsert: true,
  });
  const schedulerLastResult = {
    name: SCHEDULER_NAME_LAST_RESULT,
    lspId: lsp._id,
    every: '1 minutes',
    options: { lockLifetime: 1e4, priority: 'highest' },
    email: {
      from: 'support@protranslating.com',
      template: `
    <p>Custom Query <stong>{{ customQuery.name }}</stong> is ready</p>
    <p>Click <i><a href="/get-file?noIframe=true&url=/api/lsp/{{ customQuery.lspId }}/custom-query/{{ customQuery._id }}/last-result">here</a></i> to download the result</p>
`,
      subject: 'Custom Query result ready',
      variables: {
        customQuery: { _id: 'customQueryId', lspId: 'customQueryLspId', name: 'customQueryName' },
      },
    },
  };
  await schedulersCollection.updateOne({
    name: schedulerLastResult.name, lspId: schedulerLastResult.lspId,
  }, {
    $set: schedulerLastResult,
  }, {
    upsert: true,
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
