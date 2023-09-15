const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const eop = {
  name: 'EOP',
  every: '0 0 1,15 * *',
  eopFrom: new Date(),
  eopTo: new Date(),
  options: {
    lockLifetime: 600000,
    lockLimit: 1,
    priority: 'low',
    additionalSchema: {
      eopTo: {
        validation: '',
        type: 'date',
      },
      eopFrom: {
        validation: '',
        type: 'date',
      },
    },
    additionalValues: {
      eopTo: null,
      eopFrom: null,
    },
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
    return insertIfMissing(schedulers, eop);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
