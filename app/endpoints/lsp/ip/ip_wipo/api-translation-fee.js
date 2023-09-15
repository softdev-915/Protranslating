const _ = require('lodash');
const math = require('mathjs');
const {
  Types: { ObjectId },
} = require('mongoose');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');
const { sum } = require('../../../../utils/bigjs');
const { convertToMultipleCurrencies } = require('../../../../utils/currency-exchange');
const { defaultFee } = require('../../../../utils/default-translation-fee');
const { getIpInstructionsDeadline } = require('../../../../utils/ip-instructions-deadline');
const CompanyAPI = require('../../company/company-api');
const WipoCountryAPI = require('./api-country');

const { RestError } = apiResponse;
const ENTITY_SIZES = {
  Small: 0,
  Large: 1,
};
const ENGLISH_SOURCE_LANGUAGE = 'EN';
const ENTITY_DEFAULT_CURRENCY = 'USD';
const SUPPORTED_SOURCE_LANGUAGES = ['EN', 'DE', 'FR'];
const filingLanguagesMap = {
  EN: 'ENG',
  DE: 'GER',
  FR: 'FRE',
};
const languageTranslationRatesMap = {
  EN: 'enTranslationRate',
  DE: 'deTranslationRate',
  FR: 'frTranslationRate',
};
const srcLangToEnglishFormulaMap = {
  DE: 'deTranslationFormula',
  FR: 'frTranslationFormula',
};

const directIqFieldsMap = {
  de: 'deDirectIq',
  fr: 'frDirectIq',
};

const getMergedIndirectAndDirectCountriesRates = ({
  filters, sourceLanguage, requestSourceLanguageRates, srcLangEnglishRates, countriesInDb,
}) => {
  const directIqField = directIqFieldsMap[sourceLanguage];
  const indirectTranslationCountries = countriesInDb
    .filter((c) => !c[directIqField] && _.map(filters.countries, 'name').includes(c.name.trim()));
  const indirectTranslationCountriesNames = _.map(indirectTranslationCountries, 'name');
  if (_.isEmpty(indirectTranslationCountriesNames)) {
    return requestSourceLanguageRates;
  }
  filters.hasIndirectTranslationCountries = true;
  const indirectTranslationCountriesRates = srcLangEnglishRates
    .filter((r) => indirectTranslationCountriesNames.includes(r.country));
  filters.countries.forEach((country) => {
    if (indirectTranslationCountriesNames.includes(country.name)) {
      country.shouldTranslateDirectly = false;
    }
  });
  const srcLangAndIndirectTranslationRatesDifference = _
    .differenceBy(requestSourceLanguageRates, indirectTranslationCountriesRates, 'country');
  return _.unionBy(indirectTranslationCountriesRates, srcLangAndIndirectTranslationRatesDifference, 'country');
};
const currencyFindQuery = (currencyExchangeDetailsCol) => ({ $in: currencyExchangeDetailsCol.map((r) => new ObjectId(_.get(r, 'quote._id', r.quote))) });
class WipoTranslationFeeAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      lspId: this.lspId,
      translationOnly: _.get(filters, 'translationOnly', null),
      wipoId: _.get(filters, 'wipoId', null),
      countries: _.get(filters, 'countries', []),
      descriptionWordCount: _.get(filters, 'descriptionWordCount', null),
      claimsWordCount: _.get(filters, 'claimsWordCount', null),
      drawingsWordCount: _.get(filters, 'drawingsWordCount', null),
      numberOfDrawings: _.get(filters, 'numberOfDrawings', null),
      numberOfIndependentClaims: _.get(filters, 'numberOfIndependentClaims', null),
      abstractWordCount: _.get(filters, 'abstractWordCount', null),
      drawingsPageCount: _.get(filters, 'drawingsPageCount', null),
      numberOfTotalPages: _.get(filters, 'numberOfTotalPages', null),
      numberOfClaims: _.get(filters, 'numberOfClaims', null),
      numberOfPriorityApplications: _.get(filters, 'numberOfPriorityApplications', null),
      entities: _.get(filters, 'entities', []),
      companyIpRates: _.get(filters, 'companyIpRates', []),
      defaultCompanyCurrencyCode: _.get(filters, 'defaultCompanyCurrencyCode', ENTITY_DEFAULT_CURRENCY),
      hasIndirectTranslationCountries: _.get(filters, 'hasIndirectTranslationCountries', false),
    };
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async list(filters) {
    this.logger.debug(
      `User ${this.user.email} retrieved the wipo translation fee list`,
    );
    await this._populateFiltersWithCompanyIpRates(filters);
    let translationFees = [];
    const query = this._getQueryFilters(filters);

    try {
      const countriesNames = _.map(query.countries, 'name');
      const filingLanguages = [];
      translationFees = await this.schema.IpWipoTranslationFee.find({
        country: { $in: countriesNames },
      }).lean().exec();
      const patent = await this.schema.Wipo.findOne({
        _id: new ObjectId(query.wipoId),
      }).lean().exec();
      const srcLangToEnglishTranslationFee = await this.schema.IpWipoTranslationFee.find(
        { country: 'English Translation' },
      ).lean().exec();
      const {
        deTranslationFormula, frTranslationFormula,
      } = _.first(srcLangToEnglishTranslationFee);
      const currencyExchangeDetailsCol = this.user.lsp.currencyExchangeDetails;
      const currencyExchangeDetailsColQuery = currencyFindQuery(currencyExchangeDetailsCol);
      const currencies = await this.schema.Currency.find({ _id: currencyExchangeDetailsColQuery });
      query.exchangeRates = _.get(this.user, 'lsp.currencyExchangeDetails', []);
      translationFees = query.countries.map((country, index) => {
        let fee = translationFees.find((translationFee) => translationFee.country === country.name);
        const companyRate = query.companyIpRates.find((rate) => rate.country === country.name);
        const sourceLanguage = country.shouldTranslateDirectly
          ? patent.sourceLanguage
          : ENGLISH_SOURCE_LANGUAGE;
        const shouldGetFormulasFromEngTranslationRecord = fee.filingLanguageIso === filingLanguagesMap.EN
          && sourceLanguage !== ENGLISH_SOURCE_LANGUAGE;
        if (shouldGetFormulasFromEngTranslationRecord) {
          fee = {
            ...fee,
            deTranslationFormula,
            frTranslationFormula,
            isSrcLangToEnglishTranslation: true,
          };
        }
        fee.directTranslation = country.shouldTranslateDirectly;
        const translationFee = {
          ...fee,
          translationFeeCalculated: this._calculateTranslationFee({
            sourceLanguage,
            query,
            fee,
            currencies,
            companyRate,
            filingLanguages,
          }),
        };
        if (!query.translationOnly) {
          translationFee.agencyFeeCalculated = this._calculateAgencyFee({
            query,
            fee,
            currencies,
            companyRate,
          });
          translationFee.officialFeeCalculated = this._calculateOfficialFee({
            index,
            sourceLanguage,
            query,
            fee,
            currencies,
            companyRate,
          });
        }
        return translationFee;
      });
      translationFees = _.sortBy(translationFees, [(fee) => fee.country.toUpperCase()]);
      const englishCountry = translationFees
        .find((fee) => fee.filingLanguageIso === filingLanguagesMap.EN);
      if (query.hasIndirectTranslationCountries && _.isNil(englishCountry)) {
        const srcLangToEnglishCompanyRate = query.companyIpRates.find((rate) => rate.country === 'English Translation');
        const fee = _.first(srcLangToEnglishTranslationFee);
        fee.isSrcLangToEnglishTranslation = true;
        const srcLangToEngTranslationFeeCalculated = {
          country: fee.country,
          filingLanguage: 'English',
          filingLanguageIso: filingLanguagesMap.EN,
          directTranslation: true,
          currencyCode: ENTITY_DEFAULT_CURRENCY,
          translationFeeCalculated: this._calculateTranslationFee({
            sourceLanguage: patent.sourceLanguage,
            query,
            fee,
            currencies,
            companyRate: srcLangToEnglishCompanyRate,
            filingLanguages: [],
          }),
        };
        if (!query.translationOnly) {
          srcLangToEngTranslationFeeCalculated.agencyFeeCalculated = defaultFee(currencies);
          srcLangToEngTranslationFeeCalculated.officialFeeCalculated = defaultFee(currencies);
        }
        translationFees.push(srcLangToEngTranslationFeeCalculated);
      }
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing wipo translation fee aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    const ipInstructionDeadlineQuery = Object.assign(
      query,
      { entityName: 'wipo', dbSchema: this.schema, translationFees },
    );
    const ipInstructionDeadline = await getIpInstructionsDeadline(ipInstructionDeadlineQuery);
    return {
      list: translationFees,
      total: translationFees.length,
      defaultQuoteCurrencyCode: query.defaultCompanyCurrencyCode,
      ipInstructionDeadline,
    };
  }

  _calculateAgencyFee({
    query, fee, currencies, companyRate,
  }) {
    const { defaultCompanyCurrencyCode } = query;
    const companyAgencyFee = _.get(companyRate, `agencyFee.${defaultCompanyCurrencyCode}`, null);
    const isAgencyFeeFromCompanyLevel = _.get(companyRate, 'areRatesFromCompany', false);
    let { agencyFeeFlat: agencyFee, currencyCode: baseCurrencyCode } = fee;
    if (!_.isEmpty(companyAgencyFee) && isAgencyFeeFromCompanyLevel) {
      agencyFee = companyAgencyFee.trim();
      baseCurrencyCode = defaultCompanyCurrencyCode;
    } else if (!_.isEmpty(fee.agencyFeeFormula)) {
      const variables = {
        agencyFeeFlat: fee.agencyFeeFlat || 0,
        numberOfClaims: Number(query.numberOfClaims) || 0,
        numberOfTotalPages: Number(query.numberOfTotalPages) || 0,
        specificationPageCount: Number(query.numberOfTotalPages) - Number(query.drawingsPageCount)
          || 0,
        drawingsPageCount: Number(query.drawingsPageCount) || 0,
        numberOfPriorityApplications: Number(query.numberOfPriorityApplications) || 0,
      };
      agencyFee = this._calculateSourceLangFormula(
        variables,
        fee.agencyFeeFormula,
      );
    }
    const exchangeRates = this.user.lsp.currencyExchangeDetails;
    const agencyFeeCalculated = convertToMultipleCurrencies({
      currencies,
      baseCurrencyCode,
      feeValue: agencyFee,
      exchangeRates,
    });
    return agencyFeeCalculated;
  }

  _calculateOfficialFee({
    index, sourceLanguage, query, fee, currencies, companyRate,
  }) {
    const companyTranslationRate = _.get(companyRate, `translationRate.${ENTITY_DEFAULT_CURRENCY}`, null);
    const feeTranslationRateField = languageTranslationRatesMap[sourceLanguage];
    let { [feeTranslationRateField]: translationRate } = fee;
    if (!_.isEmpty(companyTranslationRate)) {
      translationRate = companyTranslationRate;
    }
    const variables = {
      translationRate: translationRate.trim() || 0,
      descriptionWordCount: Number(query.descriptionWordCount) || 0,
      claimsWordCount: Number(query.claimsWordCount) || 0,
      drawingsWordCount: Number(query.drawingsWordCount) || 0,
      numberOfDrawings: Number(query.numberOfDrawings) || 0,
      specificationPageCount: Number(query.numberOfTotalPages) - Number(query.drawingsPageCount)
        || 0,
      numberOfIndependentClaims: Number(query.numberOfIndependentClaims) || 0,
      abstractWordCount: Number(query.abstractWordCount) || 0,
      drawingsPageCount: Number(query.drawingsPageCount) || 0,
      numberOfTotalPages: Number(query.numberOfTotalPages) || 0,
      numberOfClaims: Number(query.numberOfClaims) || 0,
      numberOfPriorityApplications: Number(query.numberOfPriorityApplications) || 0,
      entity: Number(ENTITY_SIZES[query.entities[index]]) || 0,
    };
    const localOfficialFeeEvaluated = this._calculateSourceLangFormula(
      variables,
      fee.officialFeeFormulaMath,
    );
    const exchangeRates = this.user.lsp.currencyExchangeDetails;
    const officialFeeCalculated = convertToMultipleCurrencies({
      currencies,
      baseCurrencyCode: ENTITY_DEFAULT_CURRENCY,
      feeValue: localOfficialFeeEvaluated,
      exchangeRates,
    });
    return officialFeeCalculated;
  }

  _calculateTranslationFee({
    sourceLanguage, query, fee, currencies, companyRate, filingLanguages,
  }) {
    const { defaultCompanyCurrencyCode } = query;
    const companyTranslationRate = _.get(companyRate, `translationRate.${defaultCompanyCurrencyCode}`, null);
    const feeTranslationRateField = _.get(languageTranslationRatesMap, `${sourceLanguage}`);
    let { currencyCode: baseCurrencyCode, [feeTranslationRateField]: translationRate } = fee;
    if (!_.isEmpty(companyTranslationRate)) {
      baseCurrencyCode = defaultCompanyCurrencyCode;
      translationRate = companyTranslationRate;
    }
    let translationFormula = _.get(fee, 'translationFormula');
    const exchangeRates = _.get(this.user, 'lsp.currencyExchangeDetails', []);
    if (_.get(fee, 'isSrcLangToEnglishTranslation', false)) {
      translationFormula = _.get(fee, srcLangToEnglishFormulaMap[sourceLanguage]);
    }
    const variables = {
      translationRate: translationRate.trim() || 0,
      descriptionWordCount: Number(query.descriptionWordCount) || 0,
      claimsWordCount: Number(query.claimsWordCount) || 0,
      drawingsWordCount: Number(query.drawingsWordCount) || 0,
      numberOfDrawings: Number(query.numberOfDrawings) || 0,
      abstractWordCount: Number(query.abstractWordCount) || 0,
      drawingsPageCount: Number(query.drawingsPageCount) || 0,
      exchangeRate: exchangeRates.find(({ quote }) => quote.isoCode === baseCurrencyCode).quotation,
    };
    const translationFeeCalculated = defaultFee(currencies);
    const shouldNotCalculateFees = fee.filingLanguageIso === filingLanguagesMap[sourceLanguage]
      || filingLanguages.includes(fee.filingLanguageIso);
    if (shouldNotCalculateFees) {
      return translationFeeCalculated;
    }
    filingLanguages.push(fee.filingLanguageIso);
    if (SUPPORTED_SOURCE_LANGUAGES.includes(sourceLanguage)) {
      const localFeeValue = this._calculateSourceLangFormula(
        variables,
        translationFormula,
      );
      return convertToMultipleCurrencies({
        currencies,
        baseCurrencyCode,
        feeValue: localFeeValue,
        exchangeRates,
      });
    }
    return translationFeeCalculated;
  }

  _calculateSourceLangFormula(variables, formula) {
    if (_.isNil(formula)) {
      return 0;
    }
    let computed = formula;
    Object.keys(variables).forEach((key) => {
      let regexp = null;
      if (key === 'drawingsPageCount') {
        regexp = new RegExp(`{{${key}}}`, 'g');
      } else {
        regexp = new RegExp(`{${key}}`, 'g');
      }
      computed = computed.replace(regexp, variables[key]);
    });
    computed = computed.replace(/\$/g, '');
    const evaluatedFormula = math.evaluate(computed, variables);
    return _.round(evaluatedFormula, 2);
  }

  totalCountryFee(country) {
    let feeTotal = sum(Number(country.translationFee), Number(country.agencyFee));
    feeTotal = sum(feeTotal, Number(country.officialFee));
    return feeTotal;
  }

  async getPatentSourceLanguage(wipoId) {
    const patent = await this.schema.Wipo.findOne({
      _id: new ObjectId(wipoId),
    }).select({ sourceLanguage: 1, _id: 0 }).lean().exec();
    const { sourceLanguage } = patent;
    return sourceLanguage.toLowerCase();
  }

  async _populateFiltersWithCompanyIpRates(filters) {
    if (_.isNil(filters.companyId)) {
      throw new RestError(400, { message: 'Failed to prepare filters: missing company id' });
    }
    const companyAPI = new CompanyAPI(this.logger, { user: this.user });
    const wipoCountryAPI = new WipoCountryAPI(this.logger, { user: this.user });
    const sourceLanguage = await this.getPatentSourceLanguage(filters.wipoId);
    const { list: countriesInDb } = await wipoCountryAPI.list(filters);
    const rates = await companyAPI.getIpRates(filters.companyId, 'wipo', sourceLanguage);

    if (!_.isEqual(sourceLanguage, 'en')) {
      const { entityIpRates: srcLangEnglishRates } = await companyAPI.getIpRates(filters.companyId, 'wipo', 'en');
      rates.entityIpRates = getMergedIndirectAndDirectCountriesRates({
        filters,
        sourceLanguage,
        requestSourceLanguageRates: rates.entityIpRates,
        srcLangEnglishRates,
        countriesInDb,
      });
    }
    filters.companyIpRates = _.defaultTo(rates.entityIpRates, []);
    filters.defaultCompanyCurrencyCode = rates.defaultCompanyCurrencyCode;
  }
}

module.exports = WipoTranslationFeeAPI;
