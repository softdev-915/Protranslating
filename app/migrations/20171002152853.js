const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const requests = db.collection('requests');
    const catTool = db.collection('catTool');
    const wrongCatToolName = 'memoq';
    const correctCatToolName = 'MemoQ';
    // Remove cat tool, no worries it's not linked or referenced
    return catTool.remove({ name: wrongCatToolName })
      // eslint-disable-next-line arrow-body-style
      .then(() => {
        // Update requests with wrong cat tool
        // No extra treatment necessary because they aren't linked or referenced
        // just plain text
        return requests.update(
          { catTool: wrongCatToolName },
          {
            $set: { catTool: correctCatToolName },
          },
          { multi: true });
      })
      .then(() => users.find({ 'accounts.catTools': wrongCatToolName }))
      .then(userList => userList.toArray())
      .then(userArray => Promise.all(userArray.map((u) => {
        u.accounts = u.accounts.map((a) => {
          a.catTools = a.catTools.map((ct) => {
            if (ct === wrongCatToolName) {
              return correctCatToolName;
            }
            return ct;
          });
          // make this array to have only unique values
          a.catTools = _.uniq(a.catTools);
          return a;
        });
        return users.update({ _id: u._id }, u);
      })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
