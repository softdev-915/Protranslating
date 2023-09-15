const ApplicationCrypto = require('../../../../app/components/crypto');

const applicationCrypto = new ApplicationCrypto('../../../../key/key');

const encrypted = applicationCrypto.encrypt('Welcome123');

console.log(encrypted);
console.log(applicationCrypto.decrypt(encrypted));
