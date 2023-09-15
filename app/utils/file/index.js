const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');

const CUSTOM_ASSERT_TIMEOUT = 10 * 1000;
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];
const MIMETYPE_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MIMETYPE_CSV = 'text/csv';
const md5 = filePath => new Promise((resolve, reject) => {
  const output = crypto.createHash('md5');
  const input = fs.createReadStream(filePath);

  input.on('error', (err) => {
    reject(err);
  });
  output.once('readable', () => {
    const hash = output.read().toString('hex');

    resolve(hash);
  });
  input.pipe(output);
});
const fileStat = Promise.promisify(fs.stat);
const md5FromString = (string) => crypto.createHash('md5').update(string).digest('hex');
const imagetoBase64 = (buffer, mime) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Not a Buffer instance');
  }
  if (VALID_IMAGE_MIME_TYPES.indexOf(mime) === -1) {
    throw new Error('Not a valid mime type');
  }
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

const doesFileExist = async function (filePath) {
  const fileExists = await new Promise((resolve) => fs.open(filePath, 'r+', (err) => {
    if (err) {
      resolve(false);
    } else {
      resolve(true);
    }
  }));
  return fileExists;
};

const isDirectory = async function (filePath) {
  try {
    const stat = await fileStat(filePath);
    return stat.isDirectory();
  } catch (error) {
    return false;
  }
};

const isFile = async function (filePath) {
  try {
    const stat = await fileStat(filePath);
    return stat.isFile();
  } catch (error) {
    return false;
  }
};

const transformBufferToStream = (buffer) => {
  const stream = new Readable();
  stream._read = () => {};
  stream.push(buffer);
  stream.push(null);
  return stream;
};

const waitUntilFileExist =
  async function (filePath, timeout = CUSTOM_ASSERT_TIMEOUT) {
    // Wait 1 second before retrying
    await Promise.delay(1000);
    const newTimeout = timeout - 1000;
    if (newTimeout < 0) {
      throw new Error(`Timeout waiting for file ${filePath} to exist`);
    }
    const fileExists = await doesFileExist(filePath);
    if (fileExists) {
      return true;
    }
    const exists = await waitUntilFileExist(filePath, newTimeout);
    return exists;
  };
const readFiles = Promise.promisify(fs.readdir);

module.exports = {
  getFolderFromPath: (name) => path.dirname(name),
  getFilename: (name) => path.basename(name),
  getExtension: (name) => path.extname(name),
  imagetoBase64,
  md5,
  md5FromString,
  waitUntilFileExist,
  doesFileExist,
  isDirectory,
  isFile,
  readFiles,
  transformBufferToStream,
  MIMETYPE_CSV,
  MIMETYPE_XLSX,
};
