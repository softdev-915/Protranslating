const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const envConfig = configuration.environment;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // "Protranslating" and "PTI" *only* if current environment is not production
    if (envConfig.NODE_ENV === 'PROD') {
      return Promise.resolve();
    }
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
            return db.collection('users').dropIndex('email_1');
          }
          return Promise.resolve();
        }).then(() =>
          usersCol.findOne({
            email: userEmail,
            lsp: pts._id,
          })
            .then(user =>
              lspCol.findOne({ name: 'BIG-LS EUR' }).then(bigLs =>
                groupsCol.findOne({ name: 'LSP_ADMIN', lspId: bigLs._id }).then((group) => {
                  if (_.isNil(group)) {
                    throw new Error('BIG-LS EUR LMS_ADMIN group was not found');
                  }
                  return usersCol.findOne({
                    email: user.email,
                    lsp: bigLs._id,
                  }).then((userFound) => {
                    if (_.isNil(userFound)) {
                      delete user._id;
                      user.groups = [group];
                      user.lsp = bigLs._id;
                      return usersCol.insertOne(user);
                    }
                    return Promise.resolve();
                  });
                }),
              ),
            ),
        );
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
