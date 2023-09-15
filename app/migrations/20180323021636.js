const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const insertIfMissing = (schedulers, newScheduler) =>
  schedulers.findOne({ name: newScheduler.name })
    .then((scheduler) => {
      if (!scheduler) {
        return schedulers.insert(newScheduler);
      }
      return schedulers.update({ name: newScheduler.name }, { $set: newScheduler });
    });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const InactivateUser = {
      name: 'inactivate-user',
      every: '0 0 * * *',
      options: {
        lockLifetime: 10000,
        priority: 'low',
        additionalSchema: {
          inactivePeriod: {
            validation: '',
            type: 'number',
          },
          mock: {
            validation: '',
            type: 'number',
          },
        },
        additionalValues: {
          inactivePeriod: 75,
          mock: 0,
        },
      },
    };
    const schedulers = db.collection('schedulers');
    return insertIfMissing(schedulers, InactivateUser);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
