import _ from 'lodash';

/**
 * Find duplicated rate details that matches values for all props in  RATE_DETAIL_UNIQUE_PROPS
 * @param {Array} rateDetails list
 * @returns {Boolean} true if a duplicated is found
 */
const findDuplicatedRateDetailsSameRate = (rateDetails) => {
  if (Array.isArray(rateDetails) && rateDetails.length > 1) {
    return rateDetails.some((detailA, i) => rateDetails.some((detailB, j) => i !== j
        && _.get(detailA, 'breakdown.name', '') === _.get(detailB, 'breakdown.name', '')
        && _.get(detailA, 'currency.name', '') === _.get(detailB, 'currency.name', '')
        && _.get(detailA, 'translationUnit.name', '') === _.get(detailB, 'translationUnit.name', '')));
  }
  return false;
};

/**
 * Find duplicated rate details between two arrays
 * @param {Object} rate object
 * @param {Object} rate object to compare with
 * @returns {Boolean} true if objects a and b have the sames values for every prop in
 * RATE_DETAIL_UNIQUE_PROPS
 */
const findDuplicatedRateDetailsAcrossRates = (rateDetails, arrayToSearch) => rateDetails
  .some((detail) => arrayToSearch
    .some((compareDetail) => _.get(detail, 'breakdown.name', '') === _.get(compareDetail, 'breakdown.name', '')
      && _.get(detail, 'currency.name', '') === _.get(compareDetail, 'currency.name', '')
      && _.get(detail, 'translationUnit.name', '') === _.get(compareDetail, 'translationUnit.name', '')));

/**
 * Returns true if rate details are duplicated within the same rate or accross different rates
 * @param {Object} rate object
 * @param {Object} Optional rate object to compare with
 * @returns {Boolean} true if duplicated
 */
export default function hasRateDetailsDuplicated(rate, rateToCompareWith) {
  if (rateToCompareWith && rate.vueKey !== rateToCompareWith.vueKey) {
    return findDuplicatedRateDetailsAcrossRates(rate.rateDetails, rateToCompareWith.rateDetails);
  }
  return findDuplicatedRateDetailsSameRate(rate.rateDetails) && !_.isEmpty(rate.rateDetails);
}

