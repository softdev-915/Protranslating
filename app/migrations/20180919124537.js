const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { renameExistingGroups } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const lsp = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
      lsp,
    };
    const existsLmsHr = await groups.findOne({ name: 'LMS_HR' });
    const existsLspHr = await groups.findOne({ name: 'LSP_HR' });
    if (existsLmsHr && !existsLspHr) {
      await renameExistingGroups(/LMS_HR/, 'LSP_HR', collections, {});
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
