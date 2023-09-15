const _ = require('lodash');
const Big = require('big.js');

module.exports.reverseExchangeRate = (exchangeRate, decimalPlaces) => {
  Big.DP = _.isNumber(decimalPlaces) ? decimalPlaces : Big.DP;
  return new Big(1).div(exchangeRate).toString();
};

module.exports.isMultiCurrencyPayment = (accounting) => {
  const currency = _.get(accounting, 'currency.isoCode');
  const localCurrency = _.get(accounting, 'localCurrency.isoCode');
  return currency !== localCurrency;
};

module.exports.siCountryInfo = function (data, options) {
  const { siCountriesMap } = this;
  if (_.isNil(siCountriesMap)) {
    throw new Error('siCountriesMap was not found in context');
  }
  return options.fn(_.defaultTo(siCountriesMap[data], { siCountry: '', siCode: '' }));
};

module.exports.toFixed = function (number = 0, decimalPlaces = 0, getAbsoluteNumber = false) {
  if (isNaN(number)) {
    const parts = number.match(/(\D+)/g);
    const isNegative = parts[0] === '-';
    if (isNegative) {
      parts.shift();
    }
    number = number.split(parts[0]).join('');
    number = number.split(parts[1]).join('.');
    number = parseFloat(number);
  }
  if (getAbsoluteNumber && _.isBoolean(getAbsoluteNumber)) {
    number = Math.abs(number);
  }
  return parseFloat(number).toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};
