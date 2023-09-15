const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');
const { SCHEDULER_NAME_LAST_RESULT } = require('../utils/custom-query');

/**
 * @param {NativeConnection} connection
 * @returns {Promise<void>}
 */
const addCustomQueryRoles = async (connection) => {
  const newRoles = [
    'CUSTOM-QUERY_CREATE_OWN',
    'CUSTOM-QUERY_UPDATE_OWN',
    'CUSTOM-QUERY_READ_OWN',
    'CUSTOM-QUERY_UPDATE_ALL',
    'CUSTOM-QUERY_READ_ALL',
  ];
  const collections = {
    users: connection.collection('users'),
    groups: connection.collection('groups'),
    roles: connection.collection('roles'),
  };
  const groups = await collections.groups.find({ name: 'LSP_ADMIN' }).toArray();
  await addNewRole(newRoles, groups, collections);
};

/**
 * @param {NativeConnection} connection
 * @returns {Promise<void>}
 */
const addCustomQueryScheduler = async (connection) => {
  const schedulersCollection = connection.collection('schedulers');
  const lspCollection = connection.collection('lsp');
  const lspPts = await lspCollection.findOne({ name: 'Protranslating' });
  const schedulerRun = {
    name: 'custom-query-run',
    lspId: lspPts._id,
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
    lspId: lspPts._id,
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

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  await Promise.all([addCustomQueryRoles(connection), addCustomQueryScheduler(connection)]);
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
