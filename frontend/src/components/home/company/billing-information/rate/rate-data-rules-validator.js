import _ from 'lodash';
import hasRateDetailsDuplicated from './rate-detail-data-rules-validator';

const RATE_UNIQUE_PROPS = ['sourceLanguage', 'targetLanguage', 'ability'];
/**
 * Returns true if two objects share the same values for each prop in RATE_UNIQUE_PROPS
 * @param {Object} rate object
 * @param {Object} rate object to compare with
 * @returns {Boolean}
 */
const _duplicatedRatePropValues = (a, b) => {
  const allDuplicated = RATE_UNIQUE_PROPS.every((prop) => {
    if (a.vueKey === b.vueKey) {
      return false;
    }
    const rateAValue = _.get(a, prop);
    const rateBValue = _.get(b, prop);
    if (_.isNil(rateAValue)) {
      return false;
    }
    if (_.isString(rateAValue) && _.isString(rateBValue)) {
      return rateAValue === rateBValue;
    }
    if (_.has(rateAValue, '_id') && _.has(rateBValue, '_id')) {
      return rateAValue._id === rateBValue._id;
    }
    return _.get(rateAValue, 'name', '') === _.get(rateBValue, 'name', null);
  });
  return allDuplicated;
};

/**
 * Compare two rate objects by checking if their rate details are duplicated
 * @param {Object} rate object
 * @param {Object} rate object to compare with
 * @returns {Boolean}
 */
const _hasRateDetailsErrors = (rateA, rateB) => {
  const detailsDuplicated = hasRateDetailsDuplicated(rateB, rateA);
  // If comparing rate to itself, check for duplicates within the same array
  if (rateB.vueKey === rateA.vueKey) {
    return hasRateDetailsDuplicated(rateB);
  }
  const ratesDuplicated = _duplicatedRatePropValues(rateB, rateA);
  return ratesDuplicated && detailsDuplicated;
};

/**
 * Check if there is at least one duplicated rate line (rate + rateDetail values)
 * @param {Object} rate object
 * @param {Array} rates list
 * @returns {Boolean} true if rates are valid
 */
export default function hasDuplicatedRates(rates) {
  const isDuplicatedValue = rates.some((rateToCompareWith) => rates.some((currentRate) => {
    const hasRateDetailErrors = _hasRateDetailsErrors(currentRate, rateToCompareWith);
    return hasRateDetailErrors;
  }));
  return isDuplicatedValue;
}
