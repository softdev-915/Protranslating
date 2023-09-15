const _ = require('lodash');
const moment = require('moment-timezone');
const { RestError } = require('../../../api-response/index');
const logger = require('../../../log/logger');

const DATE_FORMAT_LENGTH = 25;
const filterToday = (utcOffsetInMinutes) => {
  const now = moment.utc();
  return {
    $gte: moment(now).add(utcOffsetInMinutes, 'minutes').startOf('day').subtract(utcOffsetInMinutes, 'minutes'),
    $lte: moment(now).add(utcOffsetInMinutes, 'minutes').endOf('day').subtract(utcOffsetInMinutes, 'minutes'),
  };
};

const transformDateFilter = (dateFilter, transformation) => {
  dateFilter.$gte = transformation(dateFilter.$gte);
  dateFilter.$lte = transformation(dateFilter.$lte);
  return dateFilter;
};

const dateQueryMap = {
  today: filterToday,
  yesterday: (utcOffsetInMinutes) => {
    const dateFilter = {
      $gte: moment.utc().add(utcOffsetInMinutes, 'minutes').subtract(1, 'day').startOf('day')
        .subtract(utcOffsetInMinutes, 'minutes'),
      $lte: moment.utc().add(utcOffsetInMinutes, 'minutes').subtract(1, 'day').endOf('day')
        .subtract(utcOffsetInMinutes, 'minutes'),
    };
    return dateFilter;
  },
  tomorrow: (utcOffsetMinutes) => {
    const dateFilter = {
      $gte: moment.utc().add(utcOffsetMinutes, 'minutes').add(1, 'day').startOf('day')
        .subtract(utcOffsetMinutes, 'minutes'),
      $lte: moment.utc().add(utcOffsetMinutes, 'minutes').add(1, 'day').endOf('day')
        .subtract(utcOffsetMinutes, 'minutes'),
    };
    return dateFilter;
  },
  twoDaysFromNow: (utcOffsetInMinutes) => {
    const dateFilter = filterToday(utcOffsetInMinutes);
    return transformDateFilter(dateFilter, (m) => m.add(2, 'days'));
  },
  threeDaysFromNow: (utcOffsetInMinutes) => {
    const dateFilter = filterToday(utcOffsetInMinutes);
    return transformDateFilter(dateFilter, (m) => m.add(3, 'days'));
  },
  fourDaysFromNow: (utcOffsetInMinutes) => {
    const dateFilter = filterToday(utcOffsetInMinutes);
    return transformDateFilter(dateFilter, (m) => m.add(4, 'days'));
  },
  previousSevenDays: (utcOffsetInMinutes) => {
    const dateFilter = filterToday(utcOffsetInMinutes);
    dateFilter.$gte = dateFilter.$gte.subtract(7, 'days');
    return dateFilter;
  },
  previousThirtyDays: (utcOffsetInMinutes) => {
    const dateFilter = filterToday(utcOffsetInMinutes);

    dateFilter.$gte = dateFilter.$gte.add(-30, 'days');
    return dateFilter;
  },
  nextThirtyDays: (utcOffsetInMinutes) => {
    const dateFilter = filterToday(utcOffsetInMinutes);

    dateFilter.$lte = dateFilter.$lte.add(30, 'days');
    return dateFilter;
  },
  thisYear: (utcOffsetInMinutes) => {
    const now = moment.utc();
    return {
      $gte: moment(now).add(utcOffsetInMinutes, 'minutes').startOf('year').subtract(utcOffsetInMinutes, 'minutes'),
      $lte: moment(now).add(utcOffsetInMinutes, 'minutes').endOf('year').subtract(utcOffsetInMinutes, 'minutes'),
    };
  },
  yearToDate: (utcOffsetInMinutes) => {
    const now = moment.utc();
    return {
      $gte: moment(now).add(utcOffsetInMinutes, 'minutes').startOf('year').subtract(utcOffsetInMinutes, 'minutes'),
      $lte: moment(now).add(utcOffsetInMinutes, 'minutes').endOf('day').subtract(utcOffsetInMinutes, 'minutes'),
    };
  },
  lastYear: (utcOffsetInMinutes) => {
    const now = moment.utc().add(-1, 'year');
    return {
      $gte: moment(now).add(utcOffsetInMinutes, 'minutes').startOf('year').subtract(utcOffsetInMinutes, 'minutes'),
      $lte: moment(now).add(utcOffsetInMinutes, 'minutes').endOf('year').subtract(utcOffsetInMinutes, 'minutes'),
    };
  },
  thisMonth: (utcOffsetInMinutes) => {
    const now = moment.utc();
    return {
      $gte: moment(now).add(utcOffsetInMinutes, 'minutes').startOf('month').subtract(utcOffsetInMinutes, 'minutes'),
      $lte: moment(now).add(utcOffsetInMinutes, 'minutes').endOf('month').subtract(utcOffsetInMinutes, 'minutes'),
    };
  },
};

/**
 * @typedef DateQuery
 * @type {object}
 * @property {Date} $gte the greater than equal query condition.
 * @property {string} $lte the lesser than equal query condition.
 */

/**
 * buildDateQuery generates a valid mongo query condition on dates.
 * @param {String} value the query value provided by the client. It accepts the following formats:
 * "YYYY-MM-DD" which matches the whole day.
 * "YYYY-MM-DDThh:mm:ssZ / YYYY-MM-DDThh:mm:ssZ" which matches from start of day / to end of day.
 * "today" matches from start of the current day to the end of it.
 * "yesterday" matches from start of yesterday to the end of it.
 * "tomorrow" matches from start of tomorrow to the end of it.
 * "twoDaysFromNow" matches from now to the end of the day after tomorrow.
 * "threeDaysFromNow" matches from now to the end of two days after tomorrow.
 * "fourDaysFromNow" matches from now to the end of three days after tomorrow.
 * "previousThirtyDays" matches from thirty days before now to the end of the current day.
 * "nextThirtyDays" matches from thirty days before now to the end of the current day.
 * "thisYear" matches the whole year.
 * "yearToDate" matches from the start of the year to the current day.
 * "lastYear" matches last year.
 * @param {Number} utcOffsetInMinutes the utc offset in minutes.
 * @returns {DateQuery}
 */
const buildDateQuery = function (value, utcOffsetInMinutes, castToDate = false) {
  if (_.isNil(value)) {
    throw new RestError(400, { message: `"${value}" is not a valid date query` });
  } else if (!_.isString(value)) {
    throw new RestError(400, { message: `"${value}" is not a valid date query. Expected string but got ${typeof value}` });
  } else if (_.isFinite(+value)) {
    throw new RestError(400, { message: `${value} is a Number` });
  }
  const availableTimeZones = moment.tz.names();
  const isTzDatabaseFormat = availableTimeZones.includes(utcOffsetInMinutes);
  if (isTzDatabaseFormat) {
    utcOffsetInMinutes = moment.tz(utcOffsetInMinutes).utcOffset();
  }
  if (_.isString(utcOffsetInMinutes) && utcOffsetInMinutes.length > 0) {
    utcOffsetInMinutes = _.toNumber(utcOffsetInMinutes);
  }

  if (_.isNil(utcOffsetInMinutes)) {
    // TODO: Should we constraint utcOffsetInMinutes?
    throw new RestError(400, { message: `"${utcOffsetInMinutes}" is not a valid utc offset (in minutes)` });
  } else if (_.isNaN(utcOffsetInMinutes) || !_.isNumber(utcOffsetInMinutes)) {
    throw new RestError(400, { message: `"${utcOffsetInMinutes}" is not a valid utc offset (in minutes). It must be a number` });
  }
  const knownQueryTransformation = _.get(dateQueryMap, value);

  if (knownQueryTransformation) {
    return knownQueryTransformation(utcOffsetInMinutes);
  }
  logger.debug(`Split of date.js. Value is ${value}`);
  const splitted = _.defaultTo(value, '').split(',');
  const splittedLen = splitted.length;

  if (splittedLen === 1) {
    // Sometimes the value comes without the +
    if (value.match(' ') && value.length === DATE_FORMAT_LENGTH) {
      value = value.replace(' ', '+');
    }
    const queryDate = castToDate
      ? moment.utc(value, 'MM-DD-YYYY')
      : moment.utc(value, 'YYYY-MM-DDTHH:mm:ssZ', true);

    if (queryDate.isValid()) {
      const gteDate = _.cloneDeep(queryDate);
      const lteDate = _.cloneDeep(queryDate);
      return {
        $gte: gteDate.startOf('day').subtract(utcOffsetInMinutes, 'minutes'),
        $lte: lteDate.endOf('day').subtract(utcOffsetInMinutes, 'minutes'),
      };
    }
    throw new RestError(400, { message: `"${value}" is not a valid date` });
  } else if (splittedLen === 2) {
    const queryFromDate = moment.utc(splitted[0], 'YYYY-MM-DDTHH:mm:ssZ', true);
    const queryToDate = moment.utc(splitted[1], 'YYYY-MM-DDTHH:mm:ssZ', true);

    if (!queryFromDate.isValid()) {
      throw new RestError(400, { message: `"${splitted[0]}" is not a valid ISO 8601 date` });
    }
    if (!queryToDate.isValid()) {
      throw new RestError(400, { message: `"${splitted[1]}" is not a valid ISO 8601 date` });
    }
    if (queryFromDate.isAfter(queryToDate)) {
      throw new RestError(400, { message: `"${splitted[0]}" is after "${splitted[1]}"` });
    }
    return {
      $gte: queryFromDate,
      $lte: queryToDate,
    };
  } else {
    throw new RestError(400, { message: `"${value}" is not a valid date range` });
  }
};

const buildISODateQuery = function (value, utcOffsetInMinutes, castToDate) {
  const dateQuery = buildDateQuery(value, utcOffsetInMinutes, castToDate);

  if (dateQuery) {
    if (dateQuery.$gte) {
      dateQuery.$gte = dateQuery.$gte.toDate();
    }
    if (dateQuery.$lte) {
      dateQuery.$lte = dateQuery.$lte.toDate();
    }
  }
  return dateQuery;
};

module.exports = {
  buildDateQuery,
  buildISODateQuery,
};
