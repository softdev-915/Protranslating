const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const catTools = db.collection('catTool');
    const users = db.collection('users');
    let tools;
    return catTools.find({}).toArray()
      .then((dbCatTools) => {
        tools = dbCatTools;
        return users.find({ 'accounts.catTool': { $exists: true } }).toArray();
      })
      .then(usersInDb => Promise.map(usersInDb, (u) => {
        const t = tools.filter(c => c._id.toString() === u.accounts[0].catTool.toString())
          .map(c => c.name);
        return users.update({ _id: u._id }, {
          $set: { 'accounts.0.catTools': t }, // asuming change will be at the first lsp
          $unset: { 'accounts.0.catTool': '' },
        });
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
