const _ = require('lodash');
const math = require('mathjs');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');
const { convertToMultipleCurrencies } = require('../../../../utils/currency-exchange');
const { defaultFee } = require('../../../../utils/default-translation-fee');
const { getIpInstructionsDeadline } = require('../../../../utils/ip-instructions-deadline');

const RestError = apiResponse.RestError;
const DISCLAIMERS = {
  ARA:
    'The same Arabic translation can be used for $selected_countries. If you proceed in more than one of these countries, the translation fee will only be billed once.',
  SPA:
    'The same Spanish translation can be used for $selected_countries. If you proceed in more than one of these countries, the translation fee will only be billed once.',
};
const TRANSLATION_ONLY_TEMPLATE_NAME = '[#24] BIGIP_DirectFiling_TranslationOnly';
const FILLING_TEMPLATE_NAME = '[#25] BIGIP_DirectFiling_TranslationAndFiling';
class NodbTranslationFeeAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      countries: _.get(filters, 'countries', []),
      specificationWordCount: _.get(filters, 'specificationWordCount', 0),
      drawingsWordCount: _.get(filters, 'drawingsWordCount', 0),
      numberOfDrawings: _.get(filters, 'numberOfDrawings', 0),
      drawingsPageCount: _.get(filters, 'drawingsPageCount', 0),
      companyIpRates: _.get(filters, 'companyIpRates', []),
      defaultCompanyCurrencyCode: _.get(filters, 'defaultCompanyCurrencyCode', 'USD'),
    };
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }
  /**
   * Returns the nodb translation fee list
   * @param {Object} nodbFilters to filter the nodb translation fees returned.
   * @param {String} nodbFilters.id the nodb's id to filter.
   */
  async list(filters) {
    this.logger.debug(
      `User ${this.user.email} retrieved the nodb translation fee list`,
    );
    const query = this._getQueryFilters(filters);

    try {
      let list = await this.schema.IpNodbTranslationFee.find({
        country: { $in: query.countries },
      }, null, { sort: { country: 1 } })
        .lean()
        .exec();
      const exchangeRates = this.user.lsp.currencyExchangeDetails;
      const quotations = exchangeRates.map(e =>
        ({ _id: e.quote._id, quotation: e.quotation }),
      );
      const currencies = await this.schema.Currency.find({
        _id: { $in: quotations.map(e => e._id) },
      })
        .lean()
        .exec();
      query.currencies = currencies;
      query.exchangeRates = exchangeRates;
      const langGroups = [];
      const listCountryByLangGroups = {};
      list = list.map((fee) => {
        let translationFeeCalculated = defaultFee(currencies);
        const isCountryWithSameLanguageGroup = langGroups.find(
          langGroup => langGroup === fee.filingIsoCode,
        );
        if (_.isNil(isCountryWithSameLanguageGroup)) {
          const companyRate = query.companyIpRates.find(rate => rate.country === fee.country);
          translationFeeCalculated = this._calculateFee({
            query,
            fee,
            companyRate,
          });
          langGroups.push(fee.filingIsoCode);
          listCountryByLangGroups[fee.filingIsoCode] = [];
        }
        listCountryByLangGroups[fee.filingIsoCode].push(fee.country);
        return {
          country: fee.country,
          translationFeeCalculated: translationFeeCalculated,
          filingIsoCode: fee.filingIsoCode,
          filingLanguage: fee.filingLanguage,
        };
      });
      const disclaimers = await this._makeDisclaimers(listCountryByLangGroups);
      const ipInstructionDeadlineQuery = Object.assign(
        query,
        { entityName: 'nodb', dbSchema: this.schema, translationFees: list },
      );
      const ipInstructionDeadline = await getIpInstructionsDeadline(ipInstructionDeadlineQuery);
      return {
        list: list,
        defaultQuoteCurrencyCode: query.defaultCompanyCurrencyCode,
        ipInstructionDeadline,
        disclaimers: disclaimers,
        total: list.length,
      };
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing nodb translation fee aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
  }
  getTemplate(translationOnly) {
    const templateName = translationOnly ? TRANSLATION_ONLY_TEMPLATE_NAME : FILLING_TEMPLATE_NAME;
    return this.schema.Template.findOne({ name: templateName, lspId: this.lspId });
  }
  _calculateFee({ query, fee, companyRate }) {
    const { defaultCompanyCurrencyCode } = query;
    const companyTranslationRate = _.get(companyRate, `translationRate.${defaultCompanyCurrencyCode}`, null);
    let { translationRate, currencyCode: baseCurrencyCode } = fee;
    if (!_.isEmpty(companyTranslationRate)) {
      translationRate = companyTranslationRate;
      baseCurrencyCode = defaultCompanyCurrencyCode;
    }
    const exchangeRateDetail = query.exchangeRates
      .find(({ quote }) => quote.isoCode === baseCurrencyCode);
    const exchangeRate = _.get(exchangeRateDetail, 'quotation');
    const variables = {
      translationRate: Number(translationRate.trim()) || 0,
      specificationWordCount: Number(query.specificationWordCount) || 0,
      drawingsWordCount: Number(query.drawingsWordCount) || 0,
      exchangeRate,
    };
    const translationFee = this._calculateEnglishLangFormula(fee.translationFormula, variables);
    return convertToMultipleCurrencies({
      currencies: query.currencies,
      baseCurrencyCode,
      feeValue: translationFee,
      exchangeRates: query.exchangeRates,
    });
  }
  // translationRate * (specification + drawings) * currencyCoef
  _calculateEnglishLangFormula(formula, variables) {
    if (_.isNil(formula)) {
      return 0;
    }
    return math.evaluate(formula, variables);
  }
  async _makeDisclaimers(listCountryByLangGroups) {
    const disclaimersList = [];
    Object.keys(DISCLAIMERS).forEach((key) => {
      if (
        !_.isNil(listCountryByLangGroups[key]) &&
        DISCLAIMERS[key] &&
        listCountryByLangGroups[key].length > 1
      ) {
        disclaimersList.push(
          DISCLAIMERS[key].replace(
            '$selected_countries',
            listCountryByLangGroups[key].join(', '),
          ),
        );
      }
    });
    const ipInstructionDeadlineDisclaimer = await this.schema.IpNodbDisclaimer.findOne({
      rule: 'IP-INSTRUCTIONS-DEADLINE > Notice based on Total or Claims Word Count',
    }, { disclaimer: 1 });
    if (!_.isNil(ipInstructionDeadlineDisclaimer)) {
      disclaimersList.push(_.get(ipInstructionDeadlineDisclaimer, 'disclaimer'));
    }
    return disclaimersList;
  }
}

module.exports = NodbTranslationFeeAPI;
