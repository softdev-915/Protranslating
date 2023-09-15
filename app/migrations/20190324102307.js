const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const collections = {
      users,
      groups,
      roles,
    };
    return lsp.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        if (lsps && lsps.length === 2) {
          const ptiLsp = lsps.find(l => l.name === 'PTI');
          const ptsLsp = lsps.find(l => l.name === 'Protranslating');
          return addNewRole(['LOCATION_READ_ALL'], [{
            name: 'LSP_STAFF',
            lspId: ptsLsp._id,
          }, {
            name: 'LSP_STAFF',
            lspId: ptiLsp._id,
          }], collections);
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
