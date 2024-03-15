import _ from 'lodash';

/**
 * Extracts rate details into comparable strings
 * @param {Array} details list
 * @returns {Array} rate detail as combined strings
 */
const _extractDetails = (details) => details.map((rd) => {
  const breakdown = _.get(rd, 'breakdown.name', '');
  const currency = _.get(rd, 'currency.name', '');
  const translationUnit = _.get(rd, 'translationUnit.name', '');
  return `${breakdown}${currency}${translationUnit}`;
});

/**
 * Checks if a rate has at least 2 identical details
 * @param {Object} rate object
 * @returns {Boolean} true if there are any identical details
 */
const _hasIdenticalDetails = (rateDetails) => {
  if (_.isNil(rateDetails)) return false;
  const details = _extractDetails(rateDetails);
  return new Set(details).size !== details.length;
};

/**
 * Checks if two rates share identical details
 * @param {Object} rate object
 * @returns {Boolean} true if there are any identical details for two rates
 */
const _ratesHaveIdenticalDetails = (a, b) => {
  if (_.isNil(a) || _.isNil(b)) return false;
  const detailsA = _extractDetails(a);
  const detailsB = _extractDetails(b);
  return detailsA.some((detailA) => detailsB.includes(detailA));
};

/**
 * Returns true if two rates contain duplicate matches
 * @param {Object} rate object
 * @param {Object} rate object to compare with
 * @returns {Boolean}
 */
const _ratesAreDuplicates = (a, b) => {
  const toCompare = [
    'ability',
    'company',
    'internalDepartment',
    'sourceLanguage',
    'targetLanguage',
    'catTool',
  ];
  const toCompareA = _.pick(a, toCompare);
  const toCompareB = _.pick(b, toCompare);
  if (_.size(toCompareA) !== _.size(toCompareB)) return false;
  const ratesShareIdenticalDetails = _ratesHaveIdenticalDetails(a.rateDetails, b.rateDetails);
  const fieldsAreIdentical = toCompare.every((field) => {
    const fieldA = _.get(toCompareA, `${field}.name`, toCompareA[field]);
    const fieldB = _.get(toCompareB, `${field}.name`, toCompareB[field]);
    return fieldA === fieldB;
  });
  return fieldsAreIdentical && ratesShareIdenticalDetails;
};

const hasDuplicatedValues = (rates) => {
  const hasRatesErrors = rates.some((rate) => {
    const rateHasIdenticalDetails = _hasIdenticalDetails(rate.rateDetails);
    if (rateHasIdenticalDetails) return true;
    const ratesToCompareWith = rates.filter((r) => r.vueKey !== rate.vueKey);
    return ratesToCompareWith.some((r) => _ratesAreDuplicates(rate, r));
  });
  return hasRatesErrors;
};

export {
  hasDuplicatedValues,
};
