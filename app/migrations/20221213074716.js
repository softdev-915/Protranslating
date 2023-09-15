const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const abilities = db.collection('abilities');
  await abilities.updateMany({ name: { $in: ['Auto Scan PDF to MT Skipped', 'Auto Scan PDF to MT Translated'] } }, { $set: { system: true } });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
