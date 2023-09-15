const fs = require('fs');
const AES256 = require('./aes-256');

class ApplicationCrypto {
  constructor(keyPath) {
    if (!ApplicationCrypto.instace) {
      this.key = fs.readFileSync(keyPath);
      ApplicationCrypto.instace = this;
    }
    return ApplicationCrypto.instace;
  }

  encrypt(data) {
    const aes256 = new AES256(this.key);
    return aes256.encrypt(data);
  }

  decrypt(data) {
    const aes256 = new AES256(this.key);
    return aes256.decrypt(data);
  }
}

module.exports = ApplicationCrypto;
