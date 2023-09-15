const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole, renameExistingGroups } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    const existsLmsHr = await groups.findOne({ name: 'LMS_HR' });
    const existsLspHr = await groups.findOne({ name: 'LSP_HR' });
    if (existsLmsHr && !existsLspHr) {
      await addNewRole(['TAXID_READ_ALL', 'TAXID_CREATE_ALL'], ['LSP_ADMIN', 'LMS_HR'], collections);
      // Provide migration to rename any entry pointing to LMS_HR to LSP_HR
      // and remove the LMS_HR group
      await renameExistingGroups(/LMS_HR/, 'LSP_HR', collections, {});
      await groups.remove({ name: 'LMS_HR' });
    } else if (existsLspHr) {
      await addNewRole(['TAXID_READ_ALL', 'TAXID_CREATE_ALL'], ['LSP_ADMIN', 'LSP_HR'], collections);
    } else {
      await addNewRole(['TAXID_READ_ALL', 'TAXID_CREATE_ALL'], ['LSP_ADMIN'], collections);
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
