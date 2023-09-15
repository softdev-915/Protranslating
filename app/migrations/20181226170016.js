const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

// Migration for removing LSP_ADMIN Protranslating group from karze@protranslating.com
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    // This a production user
    const userEmail = 'karze@protranslating.com';
    const usersCol = db.collection('users');
    let protranslatingLsp;
    // Retrieve default user's LSP
    return lspCol.findOne({ name: 'Protranslating' })
      .then((pts) => {
        protranslatingLsp = pts;
        // Find PTS user
        return usersCol.findOne({
          email: userEmail,
          lsp: pts._id,
        });
      })
      .then((user) => {
        if (user) {
        // Delete LSP_ADMIN Protranslating group from user
          const updatedGroups = [];
          if (user.groups && user.groups.length > 0) {
            user.groups.forEach((group) => {
              if (group.name !== 'LSP_ADMIN' && group.lspId.toString() !== protranslatingLsp._id.toString()) {
                updatedGroups.push(group);
              }
            });
            return usersCol.updateOne({
              email: user.email,
              lsp: protranslatingLsp._id,
            }, {
              $set: {
                groups: updatedGroups,
              },
            });
          }
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
