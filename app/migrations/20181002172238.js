const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    const lspCol = db.collection('lsp');
    const lspName = 'Protranslating';
    return lspCol.findOne({ name: lspName })
      .then(protranslating =>
        usersCol.update({
          accounts: {
            $elemMatch: {
              'lsp._id': protranslating._id,
              inactiveNotifications: 'request-creation-email',
            },
          },
        }, {
          $set: {
            'accounts.$.inactiveNotifications': ['all'],
          },
        }, { multi: true }),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
