const _ = require('lodash');

const RATE_MANDATORY_PROPS = ['ability'];
const RATE_DETAIL_MANDATORY_PROPS = ['internalDepartment', 'currency', 'translationUnit'];
const RATE_UNIQUE_PROPS = ['sourceLanguage', 'targetLanguage', 'ability'];
const _duplicatedRatePropValues = (a, b) => RATE_UNIQUE_PROPS.every(prop =>
  _.get(a, `${prop}.name`, a[prop]) === _.get(b, `${prop}.name`, b[prop]));

const _duplicatedRateDetails = (rateA, rateB) => {
  if (_duplicatedRatePropValues(rateB, rateA)) {
    const rateDuplicatedPrice = rateA.rateDetails.some(rateDetailA =>
      rateB.rateDetails.some(rateDetailB => rateDetailB.price === rateDetailA.price));
    return rateDuplicatedPrice;
  }
  return false;
};

const validateRates = (rates) => {
  let hasErrors = false;
  if (rates && Array.isArray(rates) && rates.length) {
    hasErrors = rates.some((rate, rateIndex) => {
      const rateError = RATE_MANDATORY_PROPS.some(mandatoryProp =>
        _.isEmpty(rate[mandatoryProp]));
      if (rateError) {
        return true;
      }
      const rateDetailError = rate.rateDetails.some(rateDetail =>
        RATE_DETAIL_MANDATORY_PROPS.some(mandatoryProp =>
          _.isEmpty(_.get(rateDetail, mandatoryProp))));
      if (rateDetailError) {
        return true;
      }
      return rates.some((currentRate, currentRateIndex) =>
        currentRateIndex !== rateIndex && _duplicatedRateDetails(currentRate, rate));
    });
  }
  return !hasErrors;
};

module.exports = validateRates;
