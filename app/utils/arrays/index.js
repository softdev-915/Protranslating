const _ = require('lodash');
const Promise = require('bluebird');

/**
 * Compares two arrays
 * @param {Array}    arr1 an array to compare.
 * @param {Array}    arr2 another array to compare.
 * @param {Object}   options to compare.
 * @param {Function} options.comparison An optional function to compare the element.
 * (default is ===).
 * @param {Boolean}  options.matchByIndex whether all index should be compared exactly
 * or check existance. (default is true)
 */
const isEqualArray = (arr1, arr2, options) => {
  const comparison = _.get(options, 'comparison', (o1, o2) => o1 === o2);
  const matchByIndex = _.get(options, 'matchByIndex', true);
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    throw new Error('compareArray: Only arrays are accepted as params');
  }
  const len = arr1.length;
  if (len !== arr2.length) {
    return false;
  }
  if (matchByIndex) {
    for (let i = 0; i < len; i++) {
      if (!comparison(arr1[i], arr2[i])) {
        return false;
      }
    }
  } else {
    for (let i = 0; i < len; i++) {
      const elem = arr1[i];
      if (arr2.findIndex(elem2 => comparison(elem, elem2)) === -1) {
        return false;
      }
    }
  }
  return true;
};

const extractChildArray = (arr, property) =>
  _.flatten(_.map(arr, obj => _.get(obj, property, [])));

const joinObjectsByProperty = (arr, property, separator = ',') => {
  if (!Array.isArray(arr)) {
    throw new Error('joinObjectsByProperty helper expects an array');
  }
  const hasEmptyElements = arr.some(object => _.isNil(_.get(object, property, null)));
  if (hasEmptyElements) {
    throw new Error('Array contains empty elements');
  }
  return arr.map(object => _.get(object, property, '')).join(separator);
};

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};

const asyncSome = async (arr, predicate) => {
  const result = await asyncFilter(arr, predicate);
  return result.length > 0;
};

module.exports = {
  asyncSome,
  asyncFilter,
  extractChildArray,
  joinObjectsByProperty,
  isEqualArray,
};
