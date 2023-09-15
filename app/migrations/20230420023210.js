const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const breakdowns = [{
  name: 'Locked',
}, {
  name: 'Perfect Match',
}, {
  name: 'Cross File Repetitions',
}, {
  name: '99% - 95% (AP)',
}, {
  name: '99% - 95% (Internal)',
}, {
  name: '94% - 85% (AP)',
}, {
  name: '94% - 85% (Internal)',
}, {
  name: '84% - 75% (AP)',
}, {
  name: '84% - 75% (Internal)',
}];

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lsps = await db.collection('lsp').find().toArray();
  const breakdownCol = db.collection('breakdowns');
  return Promise.map(lsps, async (lsp) => {
    await breakdownCol.updateOne({
      name: 'Context match',
      lspId: connections.mongoose.Types.ObjectId(lsp._id),
    }, {
      $set: {
        name: 'Context Match',
        lspId: connections.mongoose.Types.ObjectId(lsp._id),
      },
    }, { upsert: false });
    await Promise.map(breakdowns, breakdown => breakdownCol.updateOne({
      name: breakdown.name,
      lspId: connections.mongoose.Types.ObjectId(lsp._id),
    }, {
      $set: {
        name: breakdown.name,
        lspId: connections.mongoose.Types.ObjectId(lsp._id),
      },
    }, { upsert: true }));
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
