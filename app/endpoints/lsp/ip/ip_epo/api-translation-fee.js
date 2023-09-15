const _ = require('lodash');
const math = require('mathjs');
const {
  Types: { ObjectId },
} = require('mongoose');
const apiResponse = require('../../../../components/api-response');
const { bigJsToNumber, sum } = require('../../../../utils/bigjs');
const { convertToMultipleCurrencies } = require('../../../../utils/currency-exchange');
const { defaultFee } = require('../../../../utils/default-translation-fee');
const { getIpInstructionsDeadline } = require('../../../../utils/ip-instructions-deadline');
const SchemaAwareAPI = require('../../../schema-aware-api');

const { RestError } = apiResponse;
const countryFindQuery = (query) => ({ $in: query.countries });
const currencyFindQuery = (currencyExchangeDetailsCol) => ({ $in: currencyExchangeDetailsCol.map((r) => new ObjectId(_.get(r, 'quote._id', r.quote))) });
const ENTITY_DEFAULT_CURRENCY = 'EUR';
const LANGUAGE_FORMULA_KEY_MAP = {
  EN: 'enTranslationFormula',
  DE: 'deTranslationFormula',
  FR: 'frTranslationFormula',
};
const LANGUAGE_TRANSLATION_RATE_KEY_MAP = {
  EN: 'translationRate',
  FR: 'translationRateFr',
  DE: 'translationRateDe',
};
const TRANSLATION_DESCRIPTION_KEY_MAP = {
  DE: 'deEngTranslationOfDescriptionRequired',
  FR: 'frEngTranslationOfDescriptionRequired',
};
const languageMap = {
  EN: 'English',
  FR: 'French',
  DE: 'German',
};
const COUNTRIES_TO_USE_BOTH_COMPANY_AGENCY_FEE_AND_AGENCY_FEE_FORMULA = ['Morocco'];
class EpoTranslationFeeAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      lspId: this.lspId,
      epoId: _.get(filters, 'epoId', null),
      countries: _.get(filters, 'countries', []),
      descriptionWordCount: _.get(filters, 'descriptionWordCount', null),
      claimsWordCount: _.get(filters, 'claimsWordCount', null),
      drawingsWordCount: _.get(filters, 'drawingsWordCount', null),
      drawingsPageCount: _.get(filters, 'drawingsPageCount', null),
      descriptionPageCount: _.get(filters, 'descriptionPageCount', null),
      claimsPageCount: _.get(filters, 'claimsPageCount', null),
      numberOfClaims: _.get(filters, 'numberOfClaims', null),
      translationOnly: _.get(filters, 'translationOnly', false),
      companyIpRates: _.get(filters, 'companyIpRates', []),
      defaultCompanyCurrencyCode: _.get(filters, 'defaultCompanyCurrencyCode', ENTITY_DEFAULT_CURRENCY),
      applicantCount: _.get(filters, 'applicantCount', 1),
      hasClaimsTranslationOccurred: _.get(filters, 'hasClaimsTranslationOccurred', null),
      claimsTranslationFeesTotal: _.get(filters, 'claimsTranslationFeesTotal', null),
    };
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the epo translation fee list
   * @param {Object} epoFilters to filter the epo translation fees returned.
   * @param {String} epoFilters.id the epo's id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the epo translation fee list`);
    const list = [];
    const query = this._getQueryFilters(filters);
    const patent = await this.schema.Epo.findOne({
      _id: new ObjectId(query.epoId),
    }).lean().exec();
    const sourceLanguage = _.get(patent, 'sourceLanguage');
    try {
      const disclaimers = await this.schema.IpEpoDisclaimer.find({ countries: countryFindQuery(query) });
      const translationFees = await this.schema.IpEpoTranslationFee
        .find({ country: countryFindQuery(query) }).lean().exec();
      const currencyExchangeDetailsCol = this.user.lsp.currencyExchangeDetails;
      const currencyExchangeDetailsColQuery = currencyFindQuery(currencyExchangeDetailsCol);
      const currencies = await this.schema.Currency.find({ _id: currencyExchangeDetailsColQuery });
      const descriptionFee = {
        country: 'English Translation',
        calculatedFee: defaultFee(currencies),
        originalCountry: '',
        englishTranslation: true,
        sourceLanguage,
        agencyFeeFixed: defaultFee(currencies),
        officialFee: defaultFee(currencies),
      };
      const exchangeRates = this.getExchangeRates();
      const { defaultCompanyCurrencyCode: baseCurrencyCode } = query;
      query.currencies = currencies;
      query.exchangeRates = exchangeRates;
      _.forEach(translationFees, (translationFee) => {
        const { country } = translationFee;
        const disclaimerFound = _.find(disclaimers, (d) => d.countries.includes(country));
        const mainCountry = _.get(disclaimerFound, 'countries.0', country);
        const isMainCountryIncluded = _.find(
          query.countries,
          (queryCountry) => queryCountry === mainCountry,
        ) && _.get(disclaimerFound, 'sameTranslation', false);
        const companyRate = query.companyIpRates.find((rate) => rate.country === country);
        const translationFeeOptions = {
          query, patent, currencies, disclaimerFound, companyRate,
        };
        if (!query.translationOnly) {
          const officialFeeCalculated = this.calculateOfficialFee(
            query,
            translationFee,
          );
          translationFee.officialFee = _.defaultTo(officialFeeCalculated, defaultFee(currencies));
          const agencyFeeCalculated = this.calculateAgencyFee(
            query,
            translationFee,
            companyRate,
          );
          translationFee.agencyFeeFixed = _.defaultTo(agencyFeeCalculated, defaultFee(currencies));
        }
        if (country === mainCountry) {
          this.addTranslationFee(translationFee, list, translationFeeOptions);
        } else if (!isMainCountryIncluded) {
          this.addTranslationFee(translationFee, list, translationFeeOptions);
        } else if (isMainCountryIncluded) {
          translationFee.calculatedFee = defaultFee(currencies);
          list.push(translationFee);
        }
      });
      const formulaKey = TRANSLATION_DESCRIPTION_KEY_MAP[sourceLanguage];
      let originalCountry = '';
      const englishTranslationFee = translationFees.find((fee) => {
        if (fee[formulaKey]) {
          originalCountry = fee.country;
          return true;
        }
        return false;
      });
      const englishTranslationFormula = !_.isEmpty(englishTranslationFee) ? englishTranslationFee[formulaKey] : '';
      if (!_.isEmpty(englishTranslationFormula)) {
        const calculatedFeeDescription = this.calculateEngDescriptionFormula(
          query,
          englishTranslationFormula,
        );
        const convertedFee = convertToMultipleCurrencies({
          currencies,
          baseCurrencyCode,
          feeValue: calculatedFeeDescription,
          exchangeRates,
        });
        _.forEach(_.keys(descriptionFee.calculatedFee), (key) => {
          descriptionFee.calculatedFee[key] += _.defaultTo(convertedFee[key], 0);
        });
        descriptionFee.originalCountry = originalCountry;
      }
      const sumOfDescriptionRequired = _.values(descriptionFee.calculatedFee).reduce((acc, c) => acc + c, 0);
      if (sumOfDescriptionRequired > 0) {
        list.push(descriptionFee);
      }
    } catch ({ message, stack }) {
      this.logger.error(`Error performing epo translation fee aggregation. Error: ${message}`);
      throw new RestError(500, { message });
    }
    const ipInstructionsDeadlineQuery = Object.assign(
      query,
      {
        entityName: 'epoCountriesTranslation',
        dbSchema: this.schema,
        translationFees: list,
        translationFormulaField: LANGUAGE_FORMULA_KEY_MAP[sourceLanguage],
      },
    );
    const ipInstructionsDeadline = await getIpInstructionsDeadline(ipInstructionsDeadlineQuery);
    return {
      list,
      total: list.length,
      defaultQuoteCurrencyCode: query.defaultCompanyCurrencyCode,
      ipInstructionsDeadline,
    };
  }

  async listClaimsTranslationFees(filters) {
    const list = [];
    const otherLanguages = _.get(filters, 'otherLanguages', []);
    const epoId = _.get(filters, 'epoId', null);
    const defaultCompanyCurrencyCode = _.get(filters, 'defaultCompanyCurrencyCode', ENTITY_DEFAULT_CURRENCY);
    const claimsWordCount = Number(_.get(filters, 'claimsWordCount', 0));
    try {
      const patent = await this.schema.Epo.findOne({ _id: new ObjectId(epoId) }).lean().exec();
      const currencyExchangeDetailsCol = this.user.lsp.currencyExchangeDetails;
      const currencyExchangeDetailsColQuery = currencyFindQuery(currencyExchangeDetailsCol);
      const [currencies, claimsTranslationCombinations] = await Promise.all([
        this.schema.Currency.find({ _id: currencyExchangeDetailsColQuery }),
        this.schema.IpEpoClaimsTranslationFee.find().lean().exec(),
      ]);
      const claimsTranslationFees = otherLanguages.map((targetLanguage) => ({
        language: languageMap[targetLanguage],
        calculatedFee: this.calculateClaimsTranslationFee({
          sourceLanguage: patent.sourceLanguage,
          targetLanguage,
          claimsWordCount,
          currencies,
          claimsTranslationCombinations,
        }),
        agencyFeeFixed: defaultFee(currencies),
        officialFee: defaultFee(currencies),
      }));
      if (!_.isEmpty(claimsTranslationFees)) {
        list.push(...claimsTranslationFees);
      }
    } catch ({ message, stack }) {
      this.logger.error(`Error performing epo claims translation fee aggregation. Error: ${message}`);
      throw new RestError(500, { message });
    }
    const ipInstructionsDeadlineQuery = {
      claimsWordCount,
      entityName: 'epoClaimsTranslation',
      dbSchema: this.schema,
      translationFees: list,
      defaultCompanyCurrencyCode,
    };
    const ipInstructionsDeadline = await getIpInstructionsDeadline(ipInstructionsDeadlineQuery);
    return {
      list,
      total: list.length,
      defaultQuoteCurrencyCode: defaultCompanyCurrencyCode,
      ipInstructionsDeadline,
    };
  }

  calculateFee({
    sourceLanguage, query, fee, currencies, companyRate,
  }) {
    const { defaultCompanyCurrencyCode } = query;
    const translationRateField = LANGUAGE_TRANSLATION_RATE_KEY_MAP[sourceLanguage];
    const companyTranslationRate = _.get(companyRate, `translationRate.${defaultCompanyCurrencyCode}`, null);
    let { currencyCode: baseCurrencyCode, [translationRateField]: translationRate } = fee;
    if (!_.isEmpty(companyTranslationRate)) {
      translationRate = companyTranslationRate;
      baseCurrencyCode = defaultCompanyCurrencyCode;
    }
    const {
      usdExchangeRate, targetCurrencyUsdExchangeRate,
    } = this.getForeignExchangeVariables(baseCurrencyCode);
    const variables = {
      translationRate: _.isString(translationRate) ? translationRate.trim() : 0,
      descriptionWordCount: Number(query.descriptionWordCount) || 0,
      claimsWordCount: Number(query.claimsWordCount) || 0,
      drawingsWordCount: Number(query.drawingsWordCount) || 0,
      drawingsPageCount: Number(query.drawingsPageCount) || 0,
      usdExchangeRate,
      targetCurrencyUsdExchangeRate,
    };
    const calculatedFee = {};
    if (fee.officialFilingLanguageIsoCode === 'ENG') {
      return calculatedFee;
    }
    let localFeeValue = 0;
    localFeeValue = this.calculateLangFormula(
      variables,
      fee[LANGUAGE_FORMULA_KEY_MAP[sourceLanguage]],
    );
    const convertedFee = convertToMultipleCurrencies({
      currencies,
      baseCurrencyCode,
      feeValue: localFeeValue,
      exchangeRates: this.getExchangeRates(),
    });
    return _.assign(calculatedFee, convertedFee);
  }

  calculateClaimsTranslationFee({
    sourceLanguage,
    targetLanguage,
    claimsWordCount,
    currencies,
    claimsTranslationCombinations,
  }) {
    const claimsTranslationFee = claimsTranslationCombinations.find((fee) => fee.sourceLanguageIsoCode === sourceLanguage
      && fee.targetLanguageIsoCode === targetLanguage);
    const formula = _.get(claimsTranslationFee, 'formula', '');
    const localFee = this.calculateLangFormula({ claimsWordCount }, formula);
    const calculatedFee = {};
    currencies.forEach((c) => {
      calculatedFee[c.isoCode] = 0;
    });
    return convertToMultipleCurrencies({
      currencies,
      baseCurrencyCode: _.get(claimsTranslationFee, 'currencyCode', ENTITY_DEFAULT_CURRENCY),
      feeValue: localFee,
      exchangeRates: this.getExchangeRates(),
    });
  }

  getExchangeRates() {
    return _.get(this.user, 'lsp.currencyExchangeDetails', []);
  }

  calculateLangFormula(variables, formula) {
    if (formula) {
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
      computed = computed.replace(/\s+/g, '');
      computed = computed.replace(/\$/g, '');
      const evaluatedFormula = math.evaluate(computed);
      return evaluatedFormula.toFixed(2);
    }
    return 0;
  }

  calculateOfficialFee(query, fee) {
    const feeFormula = fee.officialFeeFormula;
    let feeValue = 0;
    feeValue = feeFormula.fixedFee;
    const requestedAmount = _.reduce(
      feeFormula.formulaProperties,
      (amount, property) => amount + Number(query[property]),
      0,
    );
    if (requestedAmount > feeFormula.fixedFeeLimit) {
      const { fixedFeeLimit, overLimitFee, formula } = feeFormula;
      const { descriptionPageCount, claimsPageCount, numberOfClaims } = query;
      if (!_.isNil(formula)) {
        const scope = {
          descriptionPageCount,
          claimsPageCount,
          totalPages: requestedAmount,
          fixedFeeLimit,
          overLimitFee,
          numberOfClaims,
        };
        feeValue += math.evaluate(formula, scope);
      } else {
        feeValue += ((requestedAmount - fixedFeeLimit)) * overLimitFee;
      }
    }
    return convertToMultipleCurrencies({
      currencies: query.currencies,
      baseCurrencyCode: ENTITY_DEFAULT_CURRENCY,
      feeValue: bigJsToNumber(feeValue),
      exchangeRates: query.exchangeRates,
    });
  }

  calculateAgencyFee(query, fee, companyRate) {
    const { defaultCompanyCurrencyCode } = query;
    const companyAgencyFee = _.get(companyRate, `agencyFee.${defaultCompanyCurrencyCode}`, null);
    const isAgencyFeeFromCompanyLevel = _.get(companyRate, 'areRatesFromCompany', false);
    const companyAgencyFeeExists = !_.isEmpty(companyAgencyFee);
    const baseCurrencyCode = companyAgencyFeeExists ? defaultCompanyCurrencyCode : fee.currencyCode;
    const countryCanUseBothCompanyFeeAndFormula = COUNTRIES_TO_USE_BOTH_COMPANY_AGENCY_FEE_AND_AGENCY_FEE_FORMULA.includes(fee.country);
    const shouldUseCompanyAgencyFee = companyAgencyFeeExists && isAgencyFeeFromCompanyLevel
      && !countryCanUseBothCompanyFeeAndFormula;
    let agencyFee = _.get(fee, 'agencyFeeFixed', 0);
    if (shouldUseCompanyAgencyFee) {
      agencyFee = math.evaluate(companyAgencyFee.trim());
    } else if (!_.isEmpty(fee.agencyFeeFormula)) {
      const {
        descriptionPageCount, claimsPageCount, drawingsPageCount, numberOfClaims,
      } = query;
      const totalPages = _.sumBy([descriptionPageCount, claimsPageCount, drawingsPageCount], (count) => Number(count));
      const agencyFeeFixed = countryCanUseBothCompanyFeeAndFormula
        ? companyAgencyFee : fee.agencyFeeFixed || 0;
      const {
        usdExchangeRate, targetCurrencyUsdExchangeRate,
      } = this.getForeignExchangeVariables(baseCurrencyCode);
      const scope = {
        agencyFeeFixed,
        descriptionPageCount,
        claimsPageCount,
        drawingsPageCount,
        totalPages,
        numberOfClaims,
        usdExchangeRate,
        targetCurrencyUsdExchangeRate,
      };
      agencyFee = math.evaluate(fee.agencyFeeFormula, scope);
    }
    return convertToMultipleCurrencies({
      currencies: query.currencies,
      baseCurrencyCode,
      feeValue: bigJsToNumber(agencyFee),
      exchangeRates: query.exchangeRates,
    });
  }

  getForeignExchangeVariables(baseCurrencyCode) {
    const exchangeRates = this.getExchangeRates();
    const usdExchangeRate = exchangeRates
      .find(({ quote }) => quote.isoCode === ENTITY_DEFAULT_CURRENCY).quotation;
    const targetCurrencyUsdExchangeRate = exchangeRates
      .find(({ quote }) => quote.isoCode === baseCurrencyCode).quotation;
    return {
      usdExchangeRate,
      targetCurrencyUsdExchangeRate,
    };
  }

  calculateEngDescriptionFormula(variables, formula) {
    if (formula) {
      let computed = formula.replace('{descriptionWordCount}', variables.descriptionWordCount);
      const translationRateString = formula.substring(formula.indexOf('translationRate'), formula.length - 1);
      const translationRate = translationRateString.split('=')[1];
      computed = computed.replace(`{translationRate=${translationRate}}`, translationRate);
      const evaluatedFormula = math.evaluate(computed);
      return Number(evaluatedFormula.toFixed(2));
    }
    return 0;
  }

  addTranslationFee(translationFeeDB, list, options = {}) {
    const calculatedFees = {
      calculatedFee: this.calculateFee({
        sourceLanguage: options.patent.sourceLanguage,
        query: options.query,
        currencies: options.currencies,
        fee: translationFeeDB,
        companyRate: options.companyRate,
      }),
    };
    list.push({ ...translationFeeDB, ...calculatedFees });
  }

  feeTotal(fee) {
    let feeTotal = sum(Number(fee.translationFee), Number(fee.agencyFeeFixed));
    feeTotal = sum(feeTotal, Number(fee.officialFee));
    return feeTotal;
  }

  async getPatentSourceLanguage(epoId) {
    const patent = await this.schema.Epo.findOne({
      _id: new ObjectId(epoId),
    }).select({ sourceLanguage: 1, _id: 0 }).lean().exec();
    const { sourceLanguage } = patent;
    return sourceLanguage.toLowerCase();
  }
}

module.exports = EpoTranslationFeeAPI;
