const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

// LMS-97 migration
const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lsps = db.collection('lsp');
  const abilities = db.collection('abilities');
  const lspList = lsps.find({}).toArray();
  return Promise.mapSeries(
    lspList,
    (lsp) => abilities.updateOne({ name: 'Sales Rep', lspId: lsp._id }, {
      $set: {
        name: 'Sales Rep',
        glAccountNo: '12345',
      },
    }, { upsert: true }),
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
