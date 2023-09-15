const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const envConfig = configuration.environment;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // "Protranslating" and "PTI" *only* if current environment is not production
    if (envConfig.NODE_ENV !== 'PROD') {
      const lspCol = db.collection('lsp');
      // Retrieve default LSP
      return lspCol.findOne({ name: 'Protranslating' })
        .then((pts) => {
          const userEmail = 'e2e@sample.com';
          const usersCol = db.collection('users');
          const groupsCol = db.collection('groups');
          // Drop unique email index if found
          // Remove user email unique index if exist
          return db.collection('users').getIndexes().then((indexes) => {
            const indexesNames = Object.keys(indexes);
            if (indexesNames.indexOf('email_1') >= 0) {
              db.collection('users').dropIndex('email_1');
            }
            return Promise.resolve();
          }).then(() =>
          // Find PTS user
            usersCol.findOne({
              email: userEmail,
              lsp: pts._id,
            })
            // Create user for PTI lsp, (duplicate user and set new LSP)
              .then(user =>
                lspCol.findOne({ name: 'PTI' }).then(pti =>
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
                        user.groups = [group];
                        user.lsp = pti._id;
                        return usersCol.insertOne(user);
                      }
                      return Promise.resolve();
                    });
                  }),
                ),
              ),
          );
        });
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
