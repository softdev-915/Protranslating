const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    // This a production user
    const userEmail = 'ptzankova@protranslating.com';
    const usersCol = db.collection('users');
    const groupsCol = db.collection('groups');
    // Retrieve default user's LSP
    return lspCol.findOne({ name: 'Protranslating' })
      .then(pts =>
      // Find PTS user
        usersCol.findOne({
          email: userEmail,
          lsp: pts._id,
        }),
      )
    // Create user for PTI lsp, (duplicate user and set new LSP)
      .then((user) => {
        if (user) {
          return lspCol.findOne({ name: 'PTI' }).then(pti =>
          // Get PTI LSP_ADMIN group and assign it to the user
            groupsCol.findOne({ name: 'LSP_ADMIN', lspId: pti._id }).then((group) => {
              if (!group) {
                throw new Error('PTI LMS_ADMIN group was not found');
              }
              return usersCol.findOne({
                email: user.email,
                lsp: pti._id,
              }).then((userFound) => {
                if (!userFound) {
                  delete user._id;
                  user.groups.push(group);
                  user.lsp = pti._id;
                  return usersCol.insertOne(user);
                }
              });
            }),
          );
        }
        return Promise.resolve();
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
