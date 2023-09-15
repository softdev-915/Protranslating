const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const ApplicationCrypto = require('../components/crypto');

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const applicationCrypto = new ApplicationCrypto();

    return lspCol.update({}, {
      $set: {
        emailConnectionString: applicationCrypto.encrypt('smtp://user:password@host:port'),
      },
    }, { multi: true }).then(() => Promise.resolve());
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
