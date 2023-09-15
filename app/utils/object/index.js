const _ = require('lodash');

const flattenObject = (object, prefix = '') => {
  const result = {};
  Object.entries(object).forEach(([prop, val]) => {
    const path = !_.isEmpty(prefix) ? `${prefix}.${prop}` : prop;
    if (_.isPlainObject(val)) {
      Object.assign(result, flattenObject(val, path));
    } else if (Array.isArray(val) && _.isPlainObject(val[0])) {
      val.forEach((arrObj, i) => Object.assign(result, flattenObject(arrObj, `${path}.${i}`)));
    } else {
      result[path] = val;
    }
  });
  return result;
};

const getObjectDifferences = (objectOne, objectTwo) => {
  const differences = _.differenceWith(_.toPairs(objectOne), _.toPairs(objectTwo), _.isEqual);
  return _.keys(_.fromPairs(differences));
};

module.exports = { flattenObject, getObjectDifferences };
