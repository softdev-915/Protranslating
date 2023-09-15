const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const pd = require('pretty-data').pd;
const Promise = require('bluebird');

const PAYLOADS_XML_FOLDER = path.join(__dirname, 'xml');
const readFiles = Promise.promisify(fs.readdir);

module.exports = async () => {
  const payloadFiles = await readFiles(PAYLOADS_XML_FOLDER);
  return payloadFiles
    .map((f) => {
      const payloadName = _.camelCase(f.substring(0, f.length - 4));
      const buffer = fs.readFileSync(path.join(PAYLOADS_XML_FOLDER, f), 'utf-8');
      const payloadXml = pd.xmlmin(buffer);
      return { [payloadName]: payloadXml };
    })
    .reduce((obj, item) => Object.assign(obj, item), {});
};
