const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const securityPolicy = {
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
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Big IP' })
      .then(bigIp =>
        lspCol.updateOne({ _id: bigIp._id }, { $set: { securityPolicy: securityPolicy } }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
