const moment = require('moment');

const RANGE_LAST_YEAR = 'lastYear';
const RANGE_THIS_YEAR = 'thisYear';
const RANGE_PREVIOUS_THIRTY_DAYS = 'previousThirtyDays';
const RANGE_PREVIOUS_SEVEN_DAYS = 'previousSevenDays';
const RANGE_YESTERDAY = 'yesterday';
const RANGE_TODAY = 'today';
const RANGES = [
  RANGE_LAST_YEAR,
  RANGE_THIS_YEAR,
  RANGE_PREVIOUS_THIRTY_DAYS,
  RANGE_PREVIOUS_SEVEN_DAYS,
  RANGE_YESTERDAY,
  RANGE_TODAY,
];
const getDatesByRange = (range) => {
  let dateFrom;
  let dateTo;
  switch (range) {
    case RANGE_LAST_YEAR:
      dateFrom = moment().add(-1, 'years').startOf('year');
      dateTo = moment().add(-1, 'years').endOf('year');
      break;
    case RANGE_THIS_YEAR:
      dateFrom = moment().startOf('year');
      dateTo = moment().endOf('day');
      break;
    case RANGE_PREVIOUS_THIRTY_DAYS:
      dateFrom = moment().startOf('day').add(-30, 'days');
      dateTo = moment().endOf('day');
      break;
    case RANGE_PREVIOUS_SEVEN_DAYS:
      dateFrom = moment().startOf('day').add(-7, 'days');
      dateTo = moment().endOf('day');
      break;
    case RANGE_YESTERDAY:
      dateFrom = moment().add(-1, 'days').startOf('day');
      dateTo = moment().add(-1, 'days').endOf('day');
      break;
    case RANGE_TODAY:
      dateFrom = moment().startOf('day');
      dateTo = moment().endOf('day');
      break;
    default:
      throw new Error(`No such ${range} found in date ranges`);
  }
  return [dateFrom.toDate(), dateTo.toDate()];
};
const formatDate = (date, format = 'YYYY-MM-DD') => moment(date).format(format);
module.exports = { RANGES, getDatesByRange, formatDate };
