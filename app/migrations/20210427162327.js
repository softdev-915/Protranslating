const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const connectorsCol = db.collection('connectors');
    const schedulersCol = db.collection('schedulers');
    return connectorsCol.updateMany({ name: 'Sage Intacct' }, {
      $set: {
        deleted: true,
      },
    }).then(() =>
      schedulersCol.updateMany({ name: 'si-connector' }, {
        $set: {
          deleted: true,
        },
      }),
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
