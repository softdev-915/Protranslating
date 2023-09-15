const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../../../version.json');
let version = 'unknown';

try {
  if (fs.existsSync(versionFilePath)) {
    const versionObj = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));

    version = versionObj.v;
  }
} catch (e) {
  // nothing to do here
}

module.exports = version;
