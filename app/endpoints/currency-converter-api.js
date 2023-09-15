const _ = require('lodash');
const Big = require('big.js');
const { RestError } = require('../components/api-response');
const SchemaAwareAPI = require('./schema-aware-api');

exports.CurrencyConverter = class CurrencyConverter extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
    this.currencyExchangeDetails = null;
  }

  /**
   * @param {number} amount amount to convert
   * @param {string} fromCurrencyId - currency id to convert from
   *
   * @return {Promise} resolves converted amount
   */
  async convertToLocalCurrency(amount, fromCurrencyId, precision = 2) {
    try {
      if (_.isNil(this.currencyExchangeDetails)) {
        const { currencyExchangeDetails } = await this.schema.Lsp.findOne({ _id: this.lspId });
        this.currencyExchangeDetails = currencyExchangeDetails;
      }
      if (!_.isString(fromCurrencyId) && _.isFunction(fromCurrencyId.toString)) {
        fromCurrencyId = fromCurrencyId.toString();
      }
      const exchangeDetail = this.currencyExchangeDetails
        .find(ed => ed.quote.toString() === fromCurrencyId);
      if (_.isNil(exchangeDetail)) {
        throw new Error(`Exchange rate for ${fromCurrencyId} is not found`);
      }
      const convertedAmount = new Big(amount).div(exchangeDetail.quotation).toNumber();
      return _.round(convertedAmount, precision);
    } catch (e) {
      const message = `Failed to convert currencies: ${e.message}`;
      this.logger.error(message);
      throw new RestError(500, { message });
    }
  }
};
