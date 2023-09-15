const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const LspAPI = require('../lsp/lsp-api');
const Promise = require('bluebird');
const { RestError } = require('../../../components/api-response');

class IpApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.defaultCurrencyIsoCode = _.get(options, 'defaultCurrencyIsoCode', 'USD');
  }

  async listCurrencies() {
    const lspAPI = new LspAPI({
      logger: this.logger,
      user: this.user,
    });
    const lsp = await lspAPI.lspDetail();
    const lspCurrencies = [];
    const lspCurrencyExchangeDetails = _.get(lsp, 'currencyExchangeDetails', []);
    if (_.isArray(lspCurrencyExchangeDetails) && !_.isEmpty(lspCurrencyExchangeDetails)) {
      try {
        await Promise.map(lspCurrencyExchangeDetails, async (exchangeDetail) => {
          const currency = await this.schema.Currency.findOne({
            _id: _.get(exchangeDetail, 'quote._id', ''),
          }).lean();
          lspCurrencies.push(_.assign(currency, {
            default: currency.isoCode === this.defaultCurrencyIsoCode,
          }));
        });
      } catch (err) {
        const message = err.message || err;
        this.logger.error(`Error performing IP currencies aggregation: ${err}`);
        throw new RestError(500, { message, stack: err.stack });
      }
    }
    return {
      list: lspCurrencies,
    };
  }
}

module.exports = IpApi;
