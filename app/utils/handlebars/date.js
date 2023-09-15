const _ = require('lodash');
const moment = require('moment-timezone');

module.exports.formatDate = (date, format) => moment(date).format(format);

module.exports.toTimezoneOffset = (date, offset, format) => {
  const givenMoment = moment.utc(date).utcOffset(offset);
  if (typeof format === 'string') {
    return givenMoment.format(format);
  }
  return givenMoment.format();
};

module.exports.toTimezone = (date, timezone, format = null) => {
  if (_.isEmpty(timezone)) {
    timezone = 'Universal';
  }
  const givenMoment = moment.utc(date).tz(timezone);
  if (typeof format === 'string') {
    return givenMoment.format(format);
  }
  return givenMoment.format();
};
