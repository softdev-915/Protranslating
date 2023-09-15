const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const documentRetentionPolicyScheduler = {
  name: 'document-retention-policy',
  every: '0 0 * * *',
  options: {
    lockLifetime: 600000,
    lockLimit: 1,
    priority: 'low',
  },
};

const insertIfMissing = (schedulers, scheduler) => schedulers.findOne({ name: scheduler.name })
  .then((dbScheduler) => {
    if (!dbScheduler) {
      return schedulers.insert(scheduler);
    }
    return schedulers.update({ name: scheduler.name }, { $set: scheduler });
  });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return insertIfMissing(schedulers, documentRetentionPolicyScheduler);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
