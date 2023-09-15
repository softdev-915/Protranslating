/* eslint-disable no-await-in-loop */
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const usersCollection = db.collection('users');
    const competenceLevelsCollection = db.collection('competenceLevels');
    const competenceLevels = await competenceLevelsCollection.find().toArray();
    const bulk = usersCollection.initializeUnorderedBulkOp();
    const cursor = usersCollection.find({
      'accounts.staffDetails.competenceLevels': { $exists: true, $ne: [] }, 'accounts.lsp.name': 'Protranslating',
    });
    while (await cursor.hasNext()) {
      const u = await cursor.next();
      const ptIndex = u.accounts.findIndex(a => a.lsp.name === 'Protranslating');
      if (ptIndex !== -1) {
        const userCompetenceLevels = competenceLevels.filter(cl =>
          u.accounts[ptIndex].staffDetails.competenceLevels.includes(cl.name));
        const set = {};
        set[`accounts.${ptIndex}.staffDetails.competenceLevels`] = userCompetenceLevels.map(cl => cl._id);
        bulk.find({ _id: u._id }).updateOne({ $set: set });
      }
    }
    if (bulk.length > 0) {
      await bulk.execute();
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
