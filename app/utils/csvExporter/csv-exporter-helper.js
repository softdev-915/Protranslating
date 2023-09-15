const _ = require('lodash');
const moment = require('moment');

const transformExportData = (data) => {
  Object.entries(data).forEach(([key, value]) => {
    if (_.isPlainObject(value)) {
      data[key] = transformExportData(data[key]);
    } else if (_.isNil(value)) {
      data[key] = '';
    } else if (_.isDate(value)) {
      data[key] = moment(value).format('MM/DD/YYYY HH:mm');
    } else if (_.isString(value) && /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/.test(value)) {
      data[key] = moment(value, 'MM-DD-YYYY HH:mm').format('MM/DD/YYYY HH:mm');
    }
  });
  return data;
};

module.exports = { transformExportData };
