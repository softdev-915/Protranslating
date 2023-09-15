const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const breakdowns = [{
  name: 'Repetitions',
}, {
  name: '100% (TM)',
}, {
  name: '99% - 95% (TM)',
}, {
  name: '94% - 85% (TM)',
}, {
  name: '84% - 75% (TM)',
}, {
  name: '74% - 50% (TM)',
}, {
  name: 'New',
}];

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lsps = await db.collection('lsp').find().toArray();
  const breakdownCol = db.collection('breakdowns');
  return Promise.map(lsps, lsp =>
    Promise.map(breakdowns, breakdown => breakdownCol.updateOne({
      name: breakdown.name,
      lspId: connections.mongoose.Types.ObjectId(lsp._id),
    }, {
      $set: {
        name: breakdown.name,
        lspId: connections.mongoose.Types.ObjectId(lsp._id),
      },
    }, { upsert: true })));
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
