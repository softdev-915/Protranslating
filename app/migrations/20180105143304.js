const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return schedulers.findOne({ name: 'EOP' })
      .then((eopSch) => {
        const options = Object.assign({}, eopSch.options, {
          lockLifetime: 10800000, // 3 hours in milliseconds
          lockLimit: 1,
          concurrency: 1,
        });
        return schedulers.updateOne({ _id: eopSch._id },
          {
            $set: {
              options,
            },
          });
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
