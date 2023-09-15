const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lspCol = db.collection('lsp');
  const companiesCol = db.collection('companies');
  const requestsCol = db.collection('requests');

  await lspCol.updateMany({ pcSettings: { $exists: true, $nin: [null, ''] } }, {
    $set: {
      'pcSettings.lockedSegments': { includeInClientStatistics: false, includeInProviderStatistics: true },
    },
  },
  { upsert: true, timeStamps: false },
  );
  await companiesCol.updateMany({ pcSettings: { $exists: true, $nin: [null, ''] } }, {
    $set: {
      'pcSettings.lockedSegments': { includeInClientStatistics: false, includeInProviderStatistics: true },
    },
  },
  { upsert: true, timeStamps: false },
  );
  await requestsCol.updateMany({ pcSettings: { $exists: true, $nin: [null, ''] } }, {
    $set: {
      'pcSettings.lockedSegments': { includeInClientStatistics: false, includeInProviderStatistics: true },
    },
  },
  { upsert: true, timeStamps: false },
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
