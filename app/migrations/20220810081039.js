const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const schedulers = db.collection('schedulers');
  const agendaJobs = db.collection('agendaJobs');
  await schedulers.deleteMany({ name: 'backup-audit-db-monthly' });
  await agendaJobs.deleteMany({ name: /backup-audit-db-monthly/ });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
