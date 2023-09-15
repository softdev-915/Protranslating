const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    // Retrieve default LSP
    return lspCol.findOne({ name: 'PTI' })
      .then((pti) => {
        const userEmail = 'nurquiza@protranslating.com';
        const usersCol = db.collection('users');
        const groupsCol = db.collection('groups');
        // Drop unique email index if found
        // Remove user email unique index if exist
        return db.collection('users').getIndexes().then((indexes) => {
          const indexesNames = Object.keys(indexes);
          if (indexesNames.indexOf('email_1') >= 0) {
            db.collection('users').dropIndex('email_1');
            return this;
          }
          return Promise.resolve();
        }).then(() =>
          // Find PTI user
          usersCol.findOne({
            email: userEmail,
            lsp: pti._id,
          })
            // Create user for Big IP lsp, (duplicate user and set new LSP)
            .then(async (userReturned) => {
              let user = userReturned;
              if (!user) {
                const group = await groupsCol.findOne({ name: 'LSP_ADMIN', lspId: pti._id });
                if (!group) {
                  throw new Error('PTI LMS_ADMIN group was not found');
                }
                await usersCol.insertOne({
                  email: userEmail,
                  groups: [group],
                  lsp: pti._id,
                  type: 'Unknown',
                });
                user = await usersCol.findOne({ email: userEmail, lsp: pti._id });
              }

              lspCol.findOne({ name: 'Big IP' }).then(bigIp =>
                // Get Big IP LSP_ADMIN group and assign it to the user
                groupsCol.findOne({ name: 'LSP_ADMIN', lspId: bigIp._id }).then((group) => {
                  if (!group) {
                    throw new Error('Big IP LMS_ADMIN group was not found');
                  }
                  return usersCol.findOne({
                    email: userEmail,
                    lsp: bigIp._id,
                  }).then((userFound) => {
                    if (!userFound) {
                      delete user._id;
                      user.groups = [group];
                      user.lsp = bigIp._id;
                      return usersCol.insertOne(user);
                    }
                    return Promise.resolve();
                  });
                }),
              );
            }),
        );
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
