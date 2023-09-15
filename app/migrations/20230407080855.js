const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const ApplicationCrypto = require('../components/crypto');

// LMS-97 migration
const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const applicationCrypto = new ApplicationCrypto(configuration.environment.CRYPTO_KEY_PATH);
    return lspCol.updateMany({}, {
      $set: {
        emailConnectionString: applicationCrypto.encrypt('smtp://user:password@host:port'),
      },
    }).then(() => Promise.resolve());
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
