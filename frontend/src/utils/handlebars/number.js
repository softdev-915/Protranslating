import _ from 'lodash';

/**
 * Generate a random number between two values
 *
 * @param  {Number} `min`
 * @param  {Number} `max`
 * @contributor Tim Douglas <https://github.com/timdouglas>
 * @return {String}
 * @api public
 */

export const random = function (min, max) {
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
};

/**
 * Abbreviate numbers to the given number of `precision`. This is for
 * general numbers, not size in bytes.
 *
 * @param  {Number} `number`
 * @param  {Number} `precision`
 * @return {String}
 * @api public
 */

export const toAbbr = function (number, precision) {
  if (!_.isNumber(number)) {
    number = 0;
  }
  if (_.isUndefined(precision)) {
    precision = 2;
  }

  number = +number;
  // 2 decimal places => 100, 3 => 1000, etc.
  precision = 10 ** precision;
  const abbr = ['k', 'm', 'b', 't', 'q'];
  let len = abbr.length - 1;

  while (len >= 0) {
    const size = 10 ** ((len + 1) * 3);
    if (size <= (number + 1)) {
      number = Math.round((number * precision) / size) / precision;
      number += abbr[len];
      break;
    }
    len--;
  }
  return number;
};

/**
 * Returns a string representing the given number in exponential notation.
 *
 * ```js
 * {{toExponential number digits}};
 * ```
 * @param {Number} `number`
 * @param {Number} `fractionDigits` Optional. An integer specifying the number
 * of digits to use after the decimal point. Defaults to as many digits as
 * necessary to specify the number.
 * @return {Number}
 * @api public
 */

export const toExponential = function (number, digits) {
  if (!_.isNumber(number)) {
    number = 0;
  }
  if (_.isUndefined(digits)) {
    digits = 0;
  }
  number = +number;
  return number.toExponential(digits);
};

export const toCurrency = (value, decimalPlaces = 0) => {
  if (typeof value !== 'number') {
    return value;
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  return formatter.format(value).replace('$', '');
};

export const toFixed = function (number, decimalPlaces, getAbsoluteNumber = false) {
  if (typeof number === 'string') {
    const floatNum = parseFloat(number.replace(',', ''));
    if (isFinite(floatNum)) {
      number = floatNum;
    }
  }
  if (getAbsoluteNumber && _.isBoolean(getAbsoluteNumber)) {
    number = Math.abs(number);
  }
  if (!_.isNumber(number)) {
    number = 0;
  }
  if (_.isUndefined(decimalPlaces)) {
    decimalPlaces = 0;
  }
  number = +number;
  return toCurrency(number, decimalPlaces);
};

/**
 * @param {Number} `number`
 * @return {Number}
 * @api public
 */

export const toFloat = function (number) {
  if (typeof number === 'string') {
    number = number.replace(',', '');
    if (number === '') {
      number = '0';
    }
  }
  return parseFloat(number);
};

export const abs = function (number) {
  return Math.abs(number);
};

/**
 * @param {Number} `number`
 * @return {Number}
 * @api public
 */

export const toInt = function (number) {
  return parseInt(number, 10);
};

/**
 * @param {Number} `number`
 * @param {Number} `precision` Optional. The number of significant digits.
 * @return {Number}
 * @api public
 */

export const toPrecision = function (number, precision) {
  if (!_.isNumber(number)) {
    number = 0;
  }
  if (_.isUndefined(precision)) {
    precision = 1;
  }
  number = +number;
  return number.toPrecision(precision);
};

export const numberToCurrency = function (num, minimumFractionDigits = 2) {
  return toFixed(num, minimumFractionDigits, true).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
