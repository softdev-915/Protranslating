const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const catTools = db.collection('catTool');
    const abilities = db.collection('abilities');
    const users = db.collection('users');
    let tools;
    return catTools.find({}).toArray()
      .then((dbTools) => {
        tools = dbTools;
        return abilities.find({}).toArray();
      })
      .then(dbAbilities => Promise.map(dbAbilities, (a) => {
        if (a.catTool) {
          const ct = tools.find(t => t._id.toString() === a.catTool.toString());
          if (ct) {
            return abilities.update({ _id: a._id }, { $set: { catTool: ct.name } });
          }
        }
      }))
      .then(() => users.find({ 'accounts.abilities': { $exists: true } }).toArray())
      .then(dbUsers => Promise.map(dbUsers, (u) => {
        if (u.accounts[0].abilities && u.accounts[0].abilities.length) {
          const translatedAbilities = u.accounts[0].abilities.map(a => ({
            name: a.name,
            language: a.language,
            catTool: a.catTool ? tools.find(t =>
              t._id.toString() === a.catTool.toString()) : a.catTool,
            updatedBy: a.updatedBy,
            createdBy: a.createdBy,
          }));
          return users.update({ _id: u._id }, { $set: { 'accounts.0.abilities': translatedAbilities } });
        }
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
