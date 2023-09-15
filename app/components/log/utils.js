const _ = require('lodash');

const PRIVATE = '__private__';
const SILLY = 'silly';
const DEBUG = 'debug';
const VERBOSE = 'verbose';
const INFO = 'info';
const WARN = 'warn';
const ERROR = 'error';
const buildLog = (message) => {
  if (message.stack) {
    return [message.message, { stack: message.stack }];
  }
  return [message];
};

const filterSensibleProperties = (dataToFilter, propertiesFilter) => {
  let data;
  if (dataToFilter === null) {
    return null;
  }
  if (typeof dataToFilter !== 'object') {
    return dataToFilter;
  }
  const dataConstructor = _.get(dataToFilter, 'constructor.name');
  if (dataConstructor === 'EmbeddedDocument' || dataConstructor === 'model') {
    data = dataToFilter.toObject();
  } else {
    data = Object.assign({}, dataToFilter);
  }
  const keys = Object.keys(data);
  keys.forEach((key) => {
    if (propertiesFilter.indexOf(key) >= 0) {
      data[key] = PRIVATE;
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      if (Array.isArray(data[key])) {
        data[key] = data[key].map(d => filterSensibleProperties(d, propertiesFilter));
      } else if (data[key]._bsontype === 'ObjectID') {
        data[key] = data[key].toString();
      } else {
        data[key] = filterSensibleProperties(data[key], propertiesFilter);
      }
    }
  });
  return data;
};

module.exports = {
  SILLY,
  DEBUG,
  VERBOSE,
  INFO,
  WARN,
  ERROR,
  buildLog,
  filterSensibleProperties,
};
