const _ = require('lodash');
const ApplicationCrypto = require('../../components/crypto');
const configuration = require('../../components/configuration');

module.exports.username = (user) => {
  const nameParts = [];
  if (user) {
    if (user.firstName) {
      nameParts.push(user.firstName);
    }
    if (user.middleName) {
      nameParts.push(user.middleName);
    }
    if (user.lastName) {
      nameParts.push(user.lastName);
    }
  }
  return nameParts.join(' ');
};

module.exports.decryptTax = (taxId) => {
  if (_.isNil(taxId)) return '';
  const envConfig = configuration.environment;
  const applicationCrypto = new ApplicationCrypto(envConfig.CRYPTO_KEY_PATH);
  return applicationCrypto.decrypt(taxId);
};

