const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const catTools = db.collection('catTool');
    const collections = {
      users,
      groups,
      roles,
    };
    return addNewRole([
      'CUSTOMER-DOC-RET-PERIOD_UPDATE_ALL',
    ], [], collections).then(() => addNewRole([
      'CAT_UPDATE_OWN',
    ], ['LSP_STAFF'], collections))
      .then(() => catTools.update({
        name: 'Basic CAT',
      }, {
        name: 'Basic CAT',
      }, { upsert: true }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
