const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const newRoles = [
  'ACTIVITY-USER-NOTE_READ_ALL',
  'ACTIVITY-USER-NOTE_CREATE_ALL',
  'ACTIVITY-USER-NOTE_UPDATE_ALL',
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const collections = {
      users: db.collection('users'),
      groups: db.collection('groups'),
      roles: db.collection('roles'),
    };
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        if (lsps && lsps.length === 2) {
          const ptiLsp = lsps.find(l => l.name === 'PTI');
          const ptsLsp = lsps.find(l => l.name === 'Protranslating');
          return addNewRole(newRoles, [{
            name: 'LSP_ADMIN',
            lspId: ptsLsp._id,
          }, {
            name: 'LSP_ADMIN',
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
