const Promise = require('bluebird');
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
const insertSecurityPolicy = (lsp, lspItem, securityPolicyData) =>
  lsp.updateOne({ _id: lspItem._id }, { $set: { securityPolicy: securityPolicyData } });
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    return lsp.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] })
      .toArray()
      .then(lspList =>
        Promise.map(lspList, lspItem => insertSecurityPolicy(lsp, lspItem, securityPolicy)));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
