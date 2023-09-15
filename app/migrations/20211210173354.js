const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  return Promise.mapSeries([
    'LANGUAGE_CREATE_ALL',
    'LANGUAGE_UPDATE_ALL',
  ], role => db.collection('roles').updateOne({
    name: role,
  }, { $set: { name: role } },
  { upsert: true }),
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
