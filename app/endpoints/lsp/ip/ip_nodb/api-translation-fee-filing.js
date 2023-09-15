const _ = require('lodash');
const math = require('mathjs');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');
const { convertToMultipleCurrencies } = require('../../../../utils/currency-exchange');
const { defaultFee } = require('../../../../utils/default-translation-fee');

const RestError = apiResponse.RestError;
const DISCLAIMERS = {
  ARA:
    'The same Arabic translation can be used for $selected_countries. If you proceed in more than one of these countries, the translation fee will only be billed once.',
  SPA:
    'The same Spanish translation can be used for $selected_countries. If you proceed in more than one of these countries, the translation fee will only be billed once.',
};

const SIZES = {
  Small: 0,
  Large: 1,
};
const ENTITY_DEFAULT_CURRENCY = 'USD';

class NodbTranslationFeeAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      entities: _.get(filters, 'entities', []),
      countries: _.get(filters, 'countries', []),
      drawingsWordCount: _.get(filters, 'drawingsWordCount', 0),
      numberOfDrawings: _.get(filters, 'numberOfDrawings', 0),
      totalNumberOfPages: _.get(filters, 'totalNumberOfPages', 0),
      applicantsLength: _.get(filters, 'applicantsLength', 0),
      numberOfIndependentClaims: _.get(filters, 'numberOfIndependentClaims', 0),
      specificationWordCount: _.get(filters, 'specificationWordCount', 0),
      numberOfClaims: _.get(filters, 'numberOfClaims', 0),
      companyIpRates: _.get(filters, 'companyIpRates', []),
      defaultCompanyCurrencyCode: _.get(filters, 'defaultCompanyCurrencyCode', ENTITY_DEFAULT_CURRENCY),
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
      list = list.map((fee, index) => {
        let translationFeeCalculated = defaultFee(currencies);
        const { filingIsoCode, country } = fee;
        const isCountryWithSameLanguageGroup = langGroups.find(
          langGroup => langGroup === filingIsoCode,
        );
        const companyRate = query.companyIpRates.find(rate => rate.country === country);
        if (_.isNil(isCountryWithSameLanguageGroup)) {
          translationFeeCalculated = this._calculateFee({
            query,
            fee,
            companyRate,
          });
          langGroups.push(filingIsoCode);
          listCountryByLangGroups[filingIsoCode] = [];
        }
        listCountryByLangGroups[filingIsoCode].push(country);
        const entityField = _.get(query, `entities.${index}`);
        query.entity = SIZES[entityField];
        const officialFeeCalculated = this._calculateOfficialFee({ query, fee });
        const agencyFeeCalculated = this._calculateAgencyFee({ query, fee, companyRate });
        return {
          country,
          translationFeeCalculated: translationFeeCalculated,
          agencyFee: agencyFeeCalculated,
          officialFee: officialFeeCalculated,
          filingLanguage: fee.filingLanguage,
          filingIsoCode: filingIsoCode,
          entity: query.entities[index],
        };
      });
      const disclaimers = this._makeDisclaimers(listCountryByLangGroups);
      return {
        list: list,
        defaultQuoteCurrencyCode: query.defaultCompanyCurrencyCode,
        disclaimers: disclaimers,
        total: list.length,
      };
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing nodb translation fee aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
  }
  // Prepare data for calculate
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

  _calculateOfficialFee({ query, fee }) {
    const variables = {
      numberClaims: Number(query.numberOfClaims) || 0,
      totalPageCount: Number(query.totalNumberOfPages) || 0,
      entity: query.entity || 0,
      numberApplicants: Number(query.applicantsLength) || 0,
    };
    const officialFeeInUSDCurrency = this._calculateEnglishLangFormula(
      fee.officialFeeFormulaMath, variables,
    );
    return convertToMultipleCurrencies({
      currencies: query.currencies,
      baseCurrencyCode: ENTITY_DEFAULT_CURRENCY,
      feeValue: officialFeeInUSDCurrency,
      exchangeRates: query.exchangeRates,
    });
  }

  _calculateAgencyFee({ query, fee, companyRate }) {
    const { defaultCompanyCurrencyCode } = query;
    const companyAgencyFee = _.get(companyRate, `agencyFee.${defaultCompanyCurrencyCode}`, null);
    let { agencyFee, currencyCode: baseCurrencyCode } = fee;
    if (!_.isEmpty(companyAgencyFee)) {
      baseCurrencyCode = defaultCompanyCurrencyCode;
      agencyFee = companyAgencyFee;
    }
    return convertToMultipleCurrencies({
      currencies: query.currencies,
      baseCurrencyCode,
      feeValue: agencyFee,
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
  _makeDisclaimers(listCountryByLangGroups) {
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
    return disclaimersList;
  }
}

module.exports = NodbTranslationFeeAPI;
