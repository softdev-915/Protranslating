/* eslint-disable no-await-in-loop */
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const usersCol = db.collection('users');
    const groupsCol = db.collection('groups');
    const bulk = usersCol.initializeUnorderedBulkOp();
    // Get all groups first
    const groups = await groupsCol.find({}, { _id: 1, name: 1, lspId: 1 }).toArray();
    const cursor = usersCol.find({
      lsp: {
        $exists: true,
      },
    });
    while (await cursor.hasNext()) {
      const user = await cursor.next();
      if (user.groups && user.groups.length > 0) {
        user.groups.forEach((group) => {
          const groupInCollection = groups.find(gr => gr._id.toString() === group._id.toString());
          if (groupInCollection) {
            group.lspId = groupInCollection.lspId;
          }
        });
        // Update user groups
        bulk.find({ _id: user._id }).updateOne({
          $set: {
            groups: user.groups,
          },
        });
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
