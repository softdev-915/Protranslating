const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const schedulerCol = db.collection('schedulers');
  return schedulerCol.updateMany({ name: 'request-completed-email' }, { $set: { name: 'request-delivered-email' } });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}

