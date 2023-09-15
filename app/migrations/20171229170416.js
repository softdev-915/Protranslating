const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return schedulers.update({ name: 'EOP' }, {
      $set: {
        'options.concurrency': 1,
        'options.additionalSchema.eopLanguages': {
          validation: '',
          type: 'text',
        },
        'options.additionalValues.eopLanguages': 'en_US, ru_RU, es_CO, pt_BR, fr_CN',
      },
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
