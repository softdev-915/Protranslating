const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole, removeGroupRolesAndUserGroupRoles } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // Add new roles for both LSP
    const lspCol = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const newRoles = ['TEMPLATE_CREATE_ALL', 'TEMPLATE_READ_ALL', 'TEMPLATE_UPDATE_ALL', 'COMPANY-MIN-CHARGE_CREATE_ALL', 'COMPANY-MIN-CHARGE_UPDATE_ALL'];
    const rolesToRemove = ['QUOTE_TEMPLATE_CREATE_ALL', 'QUOTE_TEMPLATE_READ_ALL', 'QUOTE_TEMPLATE_UPDATE_ALL'];
    const collections = {
      users,
      groups,
      roles,
    };
    return lspCol.find().toArray()
      .then(lsps =>
        Promise.map(lsps, lsp =>
          Promise.resolve()
            .then(() =>
              addNewRole(newRoles, [{
                name: 'LSP_ADMIN',
                lspId: lsp._id,
              }], collections),
            )
            .then(() => removeGroupRolesAndUserGroupRoles(rolesToRemove, collections, ['LSP_ADMIN']),
            ),
        ),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
