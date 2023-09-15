const crypto = require('crypto');

class AES256Cripto {
  constructor(key, algorithm = 'aes-256-ctr') {
    this.algorithm = algorithm;
    this.key = key;
  }

  encrypt(data) {
    const sha256 = crypto.createHash('sha256');
    sha256.update(this.key);
    const iv = crypto.randomBytes(16);
    const dataBuffer = Buffer.from(data);
    const cipher = crypto.createCipheriv(this.algorithm, sha256.digest(), iv);
    const encrypted = cipher.update(dataBuffer);
    return Buffer
      .concat([iv, encrypted, cipher.final()])
      .toString('base64');
  }

  decrypt(data) {
    const sha256 = crypto.createHash('sha256');
    sha256.update(this.key);
    const input = Buffer.from(data, 'base64');
    const iv = input.subarray(0, 16);
    const encryptedData = input.subarray(16);
    const decipher = crypto.createDecipheriv(this.algorithm, sha256.digest(), iv);
    let decrypted = decipher.update(encryptedData);
    decrypted += decipher.final();
    return decrypted;
  }
}

module.exports = AES256Cripto;
