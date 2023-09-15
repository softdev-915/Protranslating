const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = await connections.mongoose.connection;
  const mtModels = db.collection('mtModels');

  await mtModels.updateMany({}, {
    $set: {
      isProductionReady: false,
    },
  });
};

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => { throw err; });
} else {
  module.exports = migration;
}
