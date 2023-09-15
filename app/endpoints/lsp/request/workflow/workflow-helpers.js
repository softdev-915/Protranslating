const _ = require('lodash');
const { areObjectIdsEqual } = require('../../../../utils/schema');

const DISCOUNT_ABILITY = 'Discount';
const rateDetailComparator = (rateDetail, invoice, filters) => {
  const companyRateBreakdown = _.defaultTo(rateDetail.breakdown, '');
  const invoiceBreakdown = _.get(invoice, 'breakdown._id');
  const isDepartmentRequired = _.get(filters, 'ability.internalDepartmentRequired', false);
  const isDepartmentMatched = isDepartmentRequired ?
    areObjectIdsEqual(rateDetail.internalDepartment, filters.internalDepartmentId) : true;

  const isBreakdownMatched = areObjectIdsEqual(invoiceBreakdown, companyRateBreakdown) ||
    (_.isEmpty(invoiceBreakdown) && _.isEmpty(companyRateBreakdown));
  const isTranslationUnitMatched = areObjectIdsEqual(_.get(invoice, 'translationUnit._id'), rateDetail.translationUnit);
  const isCurrencyMatched = areObjectIdsEqual(rateDetail.currency, filters.quoteCurrency);
  return isBreakdownMatched
    && isTranslationUnitMatched
    && isCurrencyMatched
    && isDepartmentMatched;
};

const rateComparator = ({ sourceLanguage, targetLanguage, ability }, filters) => {
  const sourceLanguageIsoCode = _.get(sourceLanguage, 'isoCode', '');
  const targetLanguageIsoCode = _.get(targetLanguage, 'isoCode', '');
  const workflowSrcLangIsoCode = _.get(filters, 'srcLang.isoCode', '');
  const workflowTgtLangIsoCode = _.get(filters, 'tgtLang.isoCode', '');
  const isAbilityMatched = !_.isEmpty(filters.ability) && ability === filters.ability.name;
  const isSourceLanguageMatched = sourceLanguageIsoCode === workflowSrcLangIsoCode;
  const isTargetLanguageMatched = workflowTgtLangIsoCode === targetLanguageIsoCode;
  const isLanguageCombinationRequired = _.get(filters.ability, 'languageCombination', false);
  const areLanguagesMatched = isLanguageCombinationRequired
    ? isSourceLanguageMatched && isTargetLanguageMatched
    : true;
  return isAbilityMatched && areLanguagesMatched;
};

const getMatchingRateDetails = (invoice, reference, companyRates) => {
  const matchingRateDetails = [];
  const matchingRates = _.filter(companyRates, rate => rateComparator(rate, reference));

  matchingRates.forEach((rate) => {
    const matchingRateDetail = rate.rateDetails
      .filter(detail => rateDetailComparator(detail, invoice, reference));
    if (!_.isEmpty(matchingRateDetail)) {
      matchingRateDetails.push(matchingRateDetail[0]);
    }
  });
  return matchingRateDetails;
};

const updateMatchingRateDetails = (invoice, filters, companyRates, companyMinChargeApi) => {
  if (_.get(filters, 'ability.name') === DISCOUNT_ABILITY) {
    invoice.unitPrice = -1;
    invoice.foreignUnitPrice = -1;
    invoice.quantity = 0;
    return;
  }
  const matchingRateDetails = getMatchingRateDetails(invoice, filters, companyRates);

  if (_.isEmpty(matchingRateDetails)) {
    invoice.unitPrice = 0;
    invoice.foreignUnitPrice = 0;
    return;
  }
  const rateDetail = matchingRateDetails[0];
  const isForeignCurrencyRequest = _.get(filters, 'localCurrency.isoCode') !== _.get(filters, 'quoteCurrency.isoCode');
  if (isForeignCurrencyRequest) {
    invoice.foreignUnitPrice = rateDetail.price;
    invoice.unitPrice = companyMinChargeApi.currencyConverter
      .convertToLocalCurrency(invoice.foreignUnitPrice, rateDetail.currency, 10);
  } else {
    invoice.unitPrice = rateDetail.price;
  }
};

module.exports = {
  updateMatchingRateDetails,
};
