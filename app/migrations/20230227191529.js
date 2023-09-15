const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const PORTAL_MT_PROVIDER = 'Portal MT';
const GOOGLE_MT_PROVIDER = 'Google MT';
const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lspCol = db.collection('lsp');
  const mtProviderCol = db.collection('mtProviders');
  const mtEngineCol = db.collection('mtEngines');
  const lvUsDemoLSP = await lspCol.findOne({ name: 'LVUS Demo' });
  if (!lvUsDemoLSP) {
    return;
  }
  await mtProviderCol.updateMany({
    lspId: lvUsDemoLSP._id,
    name: PORTAL_MT_PROVIDER,
  }, {
    $set: { name: PORTAL_MT_PROVIDER },
  }, { upsert: true });
  await mtEngineCol.updateMany({
    lspId: lvUsDemoLSP._id,
    mtProvider: PORTAL_MT_PROVIDER,
  }, {
    $set: {
      mtProvider: PORTAL_MT_PROVIDER,
      apiKey: 'no_key',
      isEditable: false,
    },
  }, { upsert: true });
  await mtEngineCol.updateMany({
    lspId: lvUsDemoLSP._id,
    mtProvider: GOOGLE_MT_PROVIDER,
  }, {
    $set: { isEditable: true },
  }, { upsert: true });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
