const _ = require('lodash');

const isValidURL = url => new RegExp('^(https?:\\/\\/)?' +
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
  '((\\d{1,3}\\.){3}\\d{1,3}))' +
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
  '(\\?[;&a-z\\d%_.~+=-]*)?' +
  '(\\#[-a-z\\d_]*)?$', 'i').test(url);
const getDownloadableGDriveURL = url =>
  `https://drive.google.com/u/0/uc?id=${url.substring(url.indexOf('d/') + 2, url.lastIndexOf('/view'))}&export=download`;
const isGDriveUrl = url => url.includes('https://drive.google.com');
const formatConnectionString = (uriString) => {
  const matches = uriString
    .replace('mongodb://', '')
    // eslint-disable-next-line no-useless-escape
    .match(/^([^:\/\?,]+):([^@\/\?,]+)@(.*)$/);
  if (_.isNil(matches)) return uriString;
  const search = `${matches[1]}:${matches[2]}`;
  const user = encodeURIComponent(matches[1]);
  const pass = encodeURIComponent(matches[2]);
  const credentials = `${user}:${pass}`;
  return uriString.replace(search, credentials);
};

module.exports = { isValidURL, getDownloadableGDriveURL, isGDriveUrl, formatConnectionString };
