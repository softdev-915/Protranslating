import _ from 'lodash';
import moment from 'moment-timezone';

export const formatDate = (date, format) => moment.utc(date).format(format);

export const stringDate = (date, format = 'YYYY-MM-DD') => formatDate(date, format).toString();

export const formatDateLocal = (date, format) => moment(date).format(format);

export const toTimezoneOffset = (date, offset, format) => {
  const givenMoment = moment.utc(date).utcOffset(offset);
  if (typeof format === 'string') {
    return givenMoment.format(format);
  }
  return givenMoment.format();
};

export const toTimezone = (date, timezone, format, locale = '') => {
  const givenMoment = moment.utc(date).tz(timezone);
  if (_.isString(locale) && locale !== '') {
    givenMoment.locale(locale);
  }
  if (typeof format === 'string') {
    return givenMoment.format(format).replace('UTC', '');
  }
  return givenMoment.format().replace('UTC', '');
};
