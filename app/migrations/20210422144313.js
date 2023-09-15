const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'US Bank' }).then((lsp) => {
      if (lsp === null) {
        return lspCol.insert({
          name: 'US Bank',
          securityPolicy: {
            passwordExpirationDays: 60,
            numberOfPasswordsToKeep: 2,
            minPasswordLength: 10,
            maxInvalidLoginAttempts: 2,
            lockEffectivePeriod: 15,
            timeoutInactivity: 30,
            passwordComplexity: {
              lowerCaseLetters: true,
              upperCaseLetters: true,
              specialCharacters: true,
              hasDigitsIncluded: true,
            },
          },
        });
      }
      return Promise.resolve();
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
