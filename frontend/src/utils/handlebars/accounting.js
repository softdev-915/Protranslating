import _, { isNumber, isUndefined } from 'lodash';

const formatAmount = function (number, decimalPlaces, currency = '', isCurrencySymbolRight = false) {
  if (typeof number === 'string') {
    const floatNum = parseFloat(number);
    if (isNumber(floatNum)) {
      number = floatNum;
    }
  }
  if (!isNumber(number)) {
    number = 0;
  }
  if (isUndefined(decimalPlaces)) {
    decimalPlaces = 0;
  }
  const isNegative = number < 0;
  if (isNegative) {
    number = Math.abs(number);
  }
  number = +number;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  const formattedAmount = formatter.format(number).replace('$', '');
  if (_.isBoolean(isCurrencySymbolRight) && isCurrencySymbolRight) {
    return `${formattedAmount}${currency}`;
  }
  return `${currency}${formattedAmount}`;
};

/**
 * Return the bracket accounting format of an amount. Taking into
 * consideration the decimal place and currency if given.
 *
 * ```handlebars
 * {{toBracketFormat 20 2 '$' }}
 * // $20.00
 *
 * {{toBracketFormat -20 2 '$' }}
 * // ($20.00)
 * ```
 * @param {*} number
 * @param {*} decimalPlaces
 * @param {*} currency
 * @returns
 */
export const toBracketFormat = function (number, decimalPlaces, currency = '', isCurrencySymbolRight = false) {
  const isNegative = number < 0;
  let formattedAmount = formatAmount(number, decimalPlaces, currency, isCurrencySymbolRight);
  if (isNegative) {
    formattedAmount = `(${formattedAmount})`;
  }
  return formattedAmount;
};

/**
 * Return the minus accounting format of an amount. Taking into
 * consideration the decimal place and currency if given.
 *
 * ```handlebars
 * {{toMinusAccountingFormat 20 2 '$' }}
 * // $20.00
 *
 * {{toMinusAccountingFormat -20 2 '$' }}
 * // -$20.00
 * ```
 * @param {*} number
 * @param {*} decimalPlaces
 * @param {*} currency
 * @returns
 */
export const toMinusAccountingFormat = function (number, decimalPlaces, currency = '', isCurrencySymbolRight = false) {
  const isNegative = number < 0;
  let formattedAmount = formatAmount(number, decimalPlaces, currency, isCurrencySymbolRight);
  if (isNegative) {
    formattedAmount = `-${formattedAmount}`;
  }
  return formattedAmount;
};
