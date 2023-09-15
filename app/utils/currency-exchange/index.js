const _ = require('lodash');
const logger = require('../../components/log/logger');

const USD_ISO_CODE = 'USD';
const convertFromUsdCurrency = (conversionQuery) => {
  const {
    currencies, feeValueNum, exchangeRates, stringifyResult, precision,
  } = conversionQuery;
  const convertedFee = {};
  currencies.forEach((c) => {
    const currencyExchangeRate = exchangeRates.find((e) => e.quote.isoCode === c.isoCode);
    const result = (feeValueNum * currencyExchangeRate.quotation);
    convertedFee[c.isoCode] = stringifyResult
      ? result.toFixed(precision) : _.round(result, precision);
  });
  return convertedFee;
};
const convertFromNonUsdCurrency = (conversionQuery) => {
  const {
    currencies, baseCurrencyCode, feeValueNum, exchangeRates, stringifyResult, precision,
  } = conversionQuery;
  const convertedFee = {};
  try {
    const baseCurrency = currencies.find((c) => c.isoCode === baseCurrencyCode);
    const baseCurrencyExchangeDetail = exchangeRates.find((e) => _.get(e, 'quote._id', e.quote) === baseCurrency._id.toString());
    const feeInUsd = (feeValueNum / baseCurrencyExchangeDetail.quotation);
    convertedFee[USD_ISO_CODE] = stringifyResult
      ? feeInUsd.toFixed(precision) : _.round(feeInUsd, precision);
    const currencyExchangeDetails = _.filter(
      exchangeRates,
      ({ quote: { isoCode } }) => ![baseCurrencyCode, USD_ISO_CODE].includes(isoCode),
    );
    currencyExchangeDetails.forEach(({ quote: { isoCode }, quotation }) => {
      const result = convertedFee[USD_ISO_CODE] * quotation;
      convertedFee[isoCode] = stringifyResult
        ? result.toFixed(precision) : _.round(result, precision);
    });
    convertedFee[baseCurrencyCode] = stringifyResult
      ? feeValueNum.toFixed(precision) : _.round(feeValueNum, precision);
    return convertedFee;
  } catch (err) {
    logger.debug(`Failed to convert fee value ${feeValueNum} from base currency code ${baseCurrencyCode}`, err);
    throw err;
  }
};

module.exports = {
  convertToMultipleCurrencies({
    currencies, baseCurrencyCode, feeValue, exchangeRates, stringifyResult = false, precision = 2,
  }) {
    const feeValueNum = Number(feeValue);
    const conversionQuery = {
      currencies, baseCurrencyCode, feeValueNum, exchangeRates, stringifyResult, precision,
    };
    if (baseCurrencyCode === USD_ISO_CODE) {
      return convertFromUsdCurrency(conversionQuery);
    }
    return convertFromNonUsdCurrency(conversionQuery);
  },
};
