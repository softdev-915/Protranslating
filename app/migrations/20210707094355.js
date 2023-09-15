const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const lsp = db.collection('lsp');
  const wipo = db.collection('wipo');
  const bigIp = await lsp.findOne({ name: 'BIG IP' });
  await wipo.updateMany(
    {},
    {
      $set: { lspId: bigIp._id },
    },
    { multi: true },
  );
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
