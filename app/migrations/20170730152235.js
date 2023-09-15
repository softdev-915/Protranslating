const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const backupAuditDbMonthly = {
  name: 'backup-notifications-monthly',
  // Change to scheduled job at beginning of month
  // '0 0 1 * *'
  every: '0 0 1 * *',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};

const insertIfMissing = (schedulers, request) => schedulers.findOne({ name: request.name })
  .then((scheduler) => {
    if (!scheduler) {
      return schedulers.insert(request);
    }
    return schedulers.update({ name: request.name }, { $set: request });
  });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return insertIfMissing(schedulers, backupAuditDbMonthly);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
