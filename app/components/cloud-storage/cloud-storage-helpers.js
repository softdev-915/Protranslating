const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const { Duplex } = require('stream');

const isOldCloudProspect = (file, filterDate) => {
  const gcsFileDateProperty = 'metadata.timeCreated';
  const awsFileDate = _.get(file, 'LastModified');
  const fileDate = _.get(file, gcsFileDateProperty, awsFileDate);

  if (fileDate) {
    let parsedFileDate;

    if (typeof fileDate === 'string') {
      parsedFileDate = moment(fileDate, 'YYYY-MM-DDThh:mm:ssZ');
    } else {
      parsedFileDate = moment(fileDate);
    }

    return parsedFileDate.isBefore(filterDate);
  }

  return false;
};

function bufferToStream(buffer) {
  const stream = new Duplex();

  stream.push(buffer);
  stream.push(null);

  return stream;
}

// https://github.com/petkaantonov/bluebird/issues/332#issuecomment-58326173
const streamToPromise = (streamObj) => new Promise((resolve, reject) => {
  streamObj.on('finish', resolve);
  streamObj.on('error', reject);
});

// Ref: https://cloud.google.com/storage/docs/naming
const isValidGcsFilename = (filename) => {
  const name = path.basename(filename);
  const wordRegex = /[A-Z]|[a-z]|[0-9]/;
  const validConditions = [
    name !== '..',
    name !== '...',
    _.isNil(name.match(/\r|\n/)),
    !_.isNil(name[0].match(wordRegex)),
    !_.isNil(name[name.length - 1].match(wordRegex)),
    _.isNil(name.toLowerCase().match(/well-known|acme-challenge/)),
  ];

  return validConditions.every((condition) => condition);
};
const sanitizeFilename = (filename) => {
  const fileExtension = path.extname(filename);
  let nameWithoutExtension = path.basename(filename, fileExtension);
  const wordRegex = /[A-Z]|[a-z]|[0-9]/;

  if (_.isNil(nameWithoutExtension[0].match(wordRegex))) {
    nameWithoutExtension = `0${nameWithoutExtension}`;
  }
  if (_.isNil(nameWithoutExtension[nameWithoutExtension.length - 1].match(wordRegex))) {
    nameWithoutExtension = `${nameWithoutExtension}0`;
  }
  const invalidCharacters = ['?', '#', '[', ']'];

  _.each(invalidCharacters, (character) => {
    nameWithoutExtension = nameWithoutExtension.split(character).join('-');
  });
  const sanitizedName = nameWithoutExtension.replace(/[/.]{2,}|well-known|acme-challenge|\r|\n\|/g, '-');

  return `${sanitizedName}${fileExtension}`;
};

const streamToString = (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', err => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

module.exports = {
  sanitizeFilename,
  isValidGcsFilename,
  isOldCloudProspect,
  bufferToStream,
  streamToPromise,
  streamToString,
};
